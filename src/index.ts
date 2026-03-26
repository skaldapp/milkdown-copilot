import type { Ctx } from "@milkdown/kit/ctx";
import type { EditorView } from "@milkdown/kit/prose/view";

import { createSlice } from "@milkdown/ctx";
import { parserCtx, serializerCtx } from "@milkdown/kit/core";
import { cloneTr } from "@milkdown/kit/prose";
import { DOMParser, DOMSerializer } from "@milkdown/kit/prose/model";
import { Plugin, PluginKey } from "@milkdown/kit/prose/state";
import { Decoration, DecorationSet } from "@milkdown/kit/prose/view";
import { $prose } from "@milkdown/kit/utils";
import { CompletionCopilot } from "monacopilot";
import { debounce } from "quasar";

const BR_TAG_REGEX = /^<br \/>|<br \/>$/g,
  column = NaN,
  lineNumber = NaN,
  cursorPosition = { column, lineNumber },
  deco = DecorationSet.empty,
  name = "MilkdownCopilot",
  key = new PluginKey(name),
  language = "markdown",
  message = "",
  model = "codestral",
  provider = "mistral",
  relatedFiles = undefined,
  second = 1000,
  technologies = ["vue", "tailwindcss", "comark"];
const init = () => ({ deco, message });

export const apiKeySlice = createSlice("", "apiKey"),
  filenameSlice = createSlice("", "filename");
export const copilotPlugin = [
  (ctx: Ctx) => {
    ctx.inject(apiKeySlice);
    ctx.inject(filenameSlice);
    return () => undefined;
  },
  $prose((ctx) => {
    let copilot: CompletionCopilot | undefined,
      localApiKey = "";

    const getHint = debounce(async (view: EditorView) => {
      const apiKey = ctx.get(apiKeySlice),
        filename = ctx.get(filenameSlice);
      if (localApiKey !== apiKey) {
        localApiKey = apiKey;
        copilot = localApiKey
          ? new CompletionCopilot(localApiKey, { model, provider })
          : undefined;
      }
      if (copilot && filename) {
        const {
            dispatch,
            state: {
              schema: { topNodeType },
              tr: {
                doc,
                selection: { from },
              },
            },
          } = view,
          { content: after } = doc.slice(from),
          textAfterCursor = ctx
            .get(serializerCtx)(
              topNodeType.createAndFill(undefined, after) ??
                topNodeType.create(undefined, after),
            )
            .replace(BR_TAG_REGEX, ""),
          { content: before } = doc.slice(0, from),
          textBeforeCursor = ctx
            .get(serializerCtx)(
              topNodeType.createAndFill(undefined, before) ??
                topNodeType.create(undefined, before),
            )
            .replace(BR_TAG_REGEX, "")
            .trim(),
          completionMetadata = {
            cursorPosition,
            filename,
            language,
            relatedFiles,
            technologies,
            textAfterCursor,
            textBeforeCursor,
          },
          body = { completionMetadata },
          { completion } = await copilot.complete({ body });

        if (completion?.replace(BR_TAG_REGEX, "").trim())
          dispatch(cloneTr(view.state.tr).setMeta(key, completion));
      }
    }, second);

    return new Plugin({
      key,
      props: {
        decorations: (state) => key.getState(state).deco,
        handleDOMEvents: {
          mousedown: ({ dispatch, state: { tr } }) => {
            dispatch(tr.setMeta(key, ""));
          },
        },
        handleKeyDown(view, event) {
          const { dispatch, state } = view,
            { message } = key.getState(state),
            { schema, tr } = state;
          const { content } = ctx.get(parserCtx)(message);

          dispatch(tr.setMeta(key, ""));
          if (event.key === "Tab" && message) {
            event.preventDefault();
            dispatch(
              tr.replaceSelection(
                DOMParser.fromSchema(schema).parseSlice(
                  DOMSerializer.fromSchema(schema).serializeFragment(content),
                ),
              ),
            );
            return true;
          } else {
            if (event.key === "Enter" || event.key.length === 1) getHint(view);
            else getHint.cancel();
            return undefined;
          }
        },
      },
      state: {
        apply(tr, value, _prevState, { doc, schema }) {
          const message = tr.getMeta(key),
            { content } = ctx.get(parserCtx)(message),
            {
              selection: {
                $anchor: { parentOffset },
                to,
              },
            } = tr;
          return typeof message === "string"
            ? {
                deco: message.length
                  ? DecorationSet.create(doc, [
                      Decoration.widget(
                        to + Number(!parentOffset),
                        DOMSerializer.fromSchema(schema).serializeFragment(
                          content,
                          {},
                          document.createElement("pre"),
                        ),
                      ),
                    ])
                  : DecorationSet.empty,
                message,
              }
            : value;
        },
        init,
      },
    });
  }),
];
