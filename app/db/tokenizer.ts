// @ts-ignore
import wasm from "@dqbd/tiktoken/lite/tiktoken_bg.wasm?module";
import model from "@dqbd/tiktoken/encoders/cl100k_base.json";
import { init, Tiktoken } from "@dqbd/tiktoken/lite/init";
import { ChatCompletionRequestMessage } from "openai/api";

export async function calculateCompletionToken(text: string): Promise<number> {
  await init((imports) => WebAssembly.instantiate(wasm, imports));
  const encoding = new Tiktoken(
    model.bpe_ranks,
    model.special_tokens,
    model.pat_str,
  );
  const tokens = encoding.encode(text).length;
  encoding.free();
  return tokens;
}

// modified form https://github.com/openai/openai-cookbook/blob/main/examples/How_to_count_tokens_with_tiktoken.ipynb
export async function calculatePromptToken(
  messages: Array<ChatCompletionRequestMessage>,
  inputModel: string,
): Promise<number> {
  await init((imports) => WebAssembly.instantiate(wasm, imports));
  const encoding = new Tiktoken(
    model.bpe_ranks,
    model.special_tokens,
    model.pat_str,
  );
  let tokensPerMessage = 0;
  let tokensPerName = 0;

  const modelMapping: Record<string, string> = {
    "gpt-3.5-turbo": "gpt-3.5-turbo-0301",
  };

  if (inputModel in modelMapping) {
    inputModel = modelMapping[inputModel];
  }

  if (inputModel === "gpt-3.5-turbo-0301") {
    tokensPerMessage = 4;
    tokensPerName = -1;
  } else {
    tokensPerMessage = 3;
    tokensPerName = 1;
  }
  let tokens = 0;
  for (const message of messages) {
    tokens += tokensPerMessage;
    for (const [key, value] of Object.entries(message)) {
      tokens += encoding.encode(value).length;
      if (key === "name") {
        tokens += tokensPerName;
      }
    }
  }
  tokens += 3;
  encoding.free();
  return tokens;
}
