import type {
  SaveReflectionRequest,
  SaveReflectionResponse,
} from "~background/messages/save-reflection";
import type { StartSessionRequest, StartSessionResponse } from "~background/messages/start-session";
import type { EndSessionRequest, EndSessionResponse } from "~background/messages/end-session";
import type {
  GetSessionStateRequest,
  GetSessionStateResponse,
} from "~background/messages/get-session-state";

declare module "@plasmohq/messaging" {
  interface MessagesMetadata {
    "save-reflection": {
      request: SaveReflectionRequest;
      response: SaveReflectionResponse;
    };
    "start-session": {
      request: StartSessionRequest;
      response: StartSessionResponse;
    };
    "end-session": {
      request: EndSessionRequest;
      response: EndSessionResponse;
    };
    "get-session-state": {
      request: GetSessionStateRequest;
      response: GetSessionStateResponse;
    };
  }
}

export {};
