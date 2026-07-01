import { onCall } from "./middlewares/onCall.js";
import { onMessagesUpsert } from "./middlewares/onMesssagesUpsert.js";
import { badMacHandler } from "./utils/badMacHandler.js";
import { errorLog } from "./utils/logger.js";

async function runSafeEventHandler(eventName, callback) {
  try {
    await callback();
  } catch (error) {
    if (badMacHandler.handleError(error, eventName)) {
      return;
    }

    errorLog(`Erro ao processar evento ${eventName}: ${error.message}`);

    if (error.stack) {
      errorLog(`Stack trace: ${error.stack}`);
    }
  }
}

function listenMessages(socket) {
  socket.ev.on("messages.upsert", async (data) => {
    const startProcess = Date.now();

    await runSafeEventHandler("messages.upsert", () =>
      onMessagesUpsert({
        socket,
        messages: data.messages,
        startProcess,
      }),
    );
  });
}

function listenCalls(socket) {
  socket.ev.process((events) => {
    if (!events?.call?.length) {
      return;
    }

    runSafeEventHandler("call", () =>
      onCall({
        socket,
        calls: events.call,
      }),
    );
  });
}

export function load(socket) {
  listenMessages(socket);
  listenCalls(socket);
}
