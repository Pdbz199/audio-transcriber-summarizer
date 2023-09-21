export enum ChatModel {
    GPT3_5 = "gpt-3.5-turbo",
    GPT4 = "gpt-4"
}

export function getChatModelFromString(chatModelStr: string): ChatModel | undefined {
    switch (chatModelStr.toLowerCase()) {
        case "gpt3_5":
            return ChatModel.GPT3_5;
        case "gpt4":
            return ChatModel.GPT4;
        default:
            throw Error(`Unsupported GPT model \"${chatModelStr}\"`)
    }
}