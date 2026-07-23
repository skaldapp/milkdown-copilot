import type { Ctx } from "@milkdown/kit/ctx";
import type { EditorView } from "@milkdown/kit/prose/view";
import type { TOpenAI } from "@skaldapp/shared";

import { createSlice } from "@milkdown/ctx";
import { parserCtx, serializerCtx } from "@milkdown/kit/core";
import { cloneTr } from "@milkdown/kit/prose";
import { DOMParser, DOMSerializer } from "@milkdown/kit/prose/model";
import { Plugin, PluginKey } from "@milkdown/kit/prose/state";
import { Decoration, DecorationSet } from "@milkdown/kit/prose/view";
import { $prose } from "@milkdown/kit/utils";
import {
  DEFAULT_COPILOT_MAX_TOKENS as max_tokens,
  DEFAULT_COPILOT_STOP_SEQUENCE as stop,
  DEFAULT_COPILOT_STREAM as stream,
  DEFAULT_COPILOT_TEMPERATURE as temperature,
  DEFAULT_COPILOT_TOP_P as top_p,
} from "@monacopilot/core";
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
  method = "POST",
  relatedFiles = undefined,
  second = 1000,
  technologies = ["vue", "tailwindcss", "comark"];
const init = () => ({ deco, message });

export const apiKeySlice = createSlice("", "apiKey"),
  baseURLSlice = createSlice("", "baseURL"),
  createCompletionCopilot = ({
    apiKey,
    baseURL,
    endpoint,
    model,
  }: {
    [K in keyof TOpenAI]: NonNullable<TOpenAI[K]>;
  }) =>
    new CompletionCopilot(undefined, {
      model: async ({ context, fileContent, instruction }) => {
        const [prefix = "", suffix = ""] = fileContent.split(
            "<|developer_cursor_is_here|>",
          ),
          Authorization = `Bearer ${apiKey}`,
          prompt = `${context}\n${instruction}\n${prefix}`;
        let text = null;
        try {
          const {
            choices: [
              {
                message: { content },
              },
            ],
          } = await (
            await fetch(`${baseURL}/${endpoint || "completions"}`, {
              body: JSON.stringify({
                max_tokens,
                model,
                prompt,
                stop,
                stream,
                ...(endpoint && { suffix }),
                temperature,
                top_p,
              }),
              headers: {
                Authorization,
                "Content-Type": "application/json",
              },
              method,
            })
          ).json();
          text = content;
        } catch (err) {
          console.log(err);
        }
        return { text };
      },
    }),
  endpointSlice = createSlice("", "endpoint"),
  filenameSlice = createSlice("", "filename"),
  modelSlice = createSlice("", "model");
export const copilotPlugin = [
  (ctx: Ctx) => {
    ctx.inject(apiKeySlice);
    ctx.inject(filenameSlice);
    ctx.inject(modelSlice);
    ctx.inject(baseURLSlice);
    ctx.inject(endpointSlice);
    return () => undefined;
  },
  $prose((ctx) => {
    let copilot: CompletionCopilot | undefined,
      localApiKey = "",
      localBaseURL = "",
      localEndpoint = "",
      localModel = "";

    const getHint = debounce(async (view: EditorView) => {
      const apiKey = ctx.get(apiKeySlice),
        baseURL = ctx.get(baseURLSlice),
        endpoint = ctx.get(endpointSlice),
        filename = ctx.get(filenameSlice),
        model = ctx.get(modelSlice);
      if (
        localApiKey !== apiKey ||
        localBaseURL !== baseURL ||
        localEndpoint !== endpoint ||
        localModel !== model
      ) {
        localApiKey = apiKey;
        localBaseURL = baseURL;
        localEndpoint = endpoint;
        localModel = model;
        copilot =
          apiKey && baseURL && model
            ? createCompletionCopilot({ apiKey, baseURL, endpoint, model })
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
