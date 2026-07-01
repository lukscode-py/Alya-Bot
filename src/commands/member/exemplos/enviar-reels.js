import { delay, generateWAMessageFromContent, proto } from "baileys";
import { randomBytes } from "node:crypto";
import { PREFIX } from "../../../config.js";
import { SAMPLE_REELS } from "../../../utils/sample-media.js";

const META_AI_BOT_JID = "867051314767696@bot";
const META_AI_BOT_NAME = "Meta AI";
const META_AI_CREATOR_NAME = "Meta";
const FORWARD_ORIGIN_META_AI = 4;
const BOT_ENTRY_POINT_INVOKE_META_AI_1ON1 = 29;
const BOT_ENTRY_POINT_INVOKE_META_AI_GROUP = 30;

const MAIN_TEXT = "Reels no WhatsApp";

export default {
  name: "enviar-reels",
  description: "Exemplo de como enviar reels em Rich Response",
  commands: ["enviar-reels", "reels", "rich-reels"],
  usage: `${PREFIX}enviar-reels`,
  /**
   * @param {CommandHandleProps} props
   */
  handle: async ({ socket, remoteJid, webMessage, sendReply, sendReact }) => {
    await sendReact("🎬");

    await delay(2000);

    const richResponse = buildRichResponse([
      makeTextSubmessage(MAIN_TEXT),
      makeReelsSubmessage(SAMPLE_REELS),
    ]);

    await sendRichResponseMessage(socket, remoteJid, richResponse, webMessage);

    await delay(2000);

    await sendReply(
      "Esse exemplo usa `messageType: 9` com `contentItemsMetadata.itemsMetadata[].reelItem` e também preenche as fontes em `richResponseSourcesMetadata`.",
    );
  },
};

function makeTextSubmessage(messageText) {
  return {
    messageType: 2,
    messageText: String(messageText || ""),
  };
}

function makeTableSubmessage(title, rows) {
  return {
    messageType: 4,
    tableMetadata: {
      title,
      rows: rows.map((row) => ({
        items: row.items.map((item) => String(item ?? "")),
        isHeading: !!row.isHeading,
      })),
    },
  };
}

function makeReelsSubmessage(items) {
  return {
    messageType: 9,
    contentItemsMetadata: {
      contentType: 1,
      itemsMetadata: items.map((item) => ({
        reelItem: {
          title: item.title,
          profileIconUrl: item.profileIconUrl,
          thumbnailUrl: item.thumbnailUrl,
          videoUrl: item.videoUrl,
        },
      })),
    },
  };
}

function buildRichResponse(submessages) {
  return {
    messageType: 1,
    submessages,
    unifiedResponse: {
      data: encodeUnifiedResponseData({
        response_id: `alya-reels-${Date.now()}-${randomBytes(6).toString("hex")}`,
        sections: submessages.map(buildUnifiedSection).filter(Boolean),
      }),
    },
  };
}

function buildUnifiedSection(submessage) {
  if (submessage.messageType === 2) {
    return {
      view_model: {
        primitive: {
          text: submessage.messageText,
          __typename: "GenAIMarkdownTextUXPrimitive",
        },
        __typename: "GenAISingleLayoutViewModel",
      },
    };
  }

  if (submessage.messageType === 4) {
    return {
      view_model: {
        primitive: {
          title: submessage.tableMetadata.title,
          rows: submessage.tableMetadata.rows.map((row) => ({
            is_header: !!row.isHeading,
            cells: row.items.map((value) => String(value ?? "")),
          })),
          __typename: "GenATableUXPrimitive",
        },
        __typename: "GenAISingleLayoutViewModel",
      },
    };
  }

  if (submessage.messageType === 9) {
    return {
      view_model: {
        primitives: submessage.contentItemsMetadata.itemsMetadata.map(
          ({ reelItem }) => ({
            reels_url: reelItem.videoUrl,
            thumbnail_url: reelItem.thumbnailUrl,
            creator: reelItem.title,
            avatar_url: reelItem.profileIconUrl,
            reels_title: "Descrição bonitinha..",
            likes_count: 0,
            shares_count: 0,
            view_count: 0,
            reel_source: getReelSource(reelItem.videoUrl),
            is_verified: true,
            __typename: "GenAIReelPrimitive",
          }),
        ),
        __typename: "GenAIHScrollLayoutViewModel",
      },
    };
  }

  return null;
}

async function sendRichResponseMessage(
  socket,
  remoteJid,
  richResponse,
  quoted,
) {
  const rich = applyForwardedMetaAiContext(richResponse, remoteJid);
  const payload = proto.Message.fromObject({
    botForwardedMessage: {
      message: {
        richResponseMessage: rich,
      },
    },
    messageContextInfo: {
      deviceListMetadata: {},
      deviceListMetadataVersion: 2,
      messageSecret: randomBytes(32),
      botMetadata: buildBotMetadata(buildRichResponseSources(REEL_ITEMS), [
        "RICH_RESPONSE_REELS",
      ]),
    },
  });
  const waMessage = generateWAMessageFromContent(remoteJid, payload, {
    quoted: JSON.parse(JSON.stringify(quoted)),
  });

  return socket.relayMessage(remoteJid, waMessage.message, {
    messageId: waMessage.key.id,
  });
}

function buildRichResponseSources(items) {
  return items.map((item, index) => ({
    provider: "UNKNOWN",
    thumbnailCDNURL: item.thumbnailUrl,
    sourceProviderURL: item.videoUrl,
    sourceQuery: "",
    faviconCDNURL: item.profileIconUrl,
    citationNumber: index + 1,
    sourceTitle: item.title,
  }));
}

function buildBotMetadata(sources = [], extraCapabilities = []) {
  return {
    modelMetadata: {
      modelType: "LLAMA_PROD",
      premiumModelStatus: "AVAILABLE",
    },
    botAgeCollectionMetadata: {},
    botResponseId: `alya-reels-${Date.now()}-${randomBytes(6).toString("hex")}`,
    verificationMetadata: {
      proofs: [],
    },
    botInfrastructureDiagnostics: {},
    richResponseSourcesMetadata: {
      sources,
    },
    capabilityMetadata: {
      capabilities: [
        "RICH_RESPONSE_STRUCTURED_RESPONSE",
        "RICH_RESPONSE_UNIFIED_RESPONSE",
        "RICH_RESPONSE_UNIFIED_TEXT_COMPONENT",
        "SESSION_TRANSPARENCY_SYSTEM_MESSAGE",
        ...extraCapabilities,
      ],
    },
  };
}

function applyForwardedMetaAiContext(richResponse, remoteJid) {
  return {
    ...richResponse,
    contextInfo: {
      isForwarded: true,
      forwardingScore: 1,
      forwardOrigin: FORWARD_ORIGIN_META_AI,
      forwardedAiBotMessageInfo: {
        botName: META_AI_BOT_NAME,
        botJid: META_AI_BOT_JID,
        creatorName: META_AI_CREATOR_NAME,
      },
      botMessageSharingInfo: {
        botEntryPointOrigin: String(remoteJid || "").endsWith("@g.us")
          ? BOT_ENTRY_POINT_INVOKE_META_AI_GROUP
          : BOT_ENTRY_POINT_INVOKE_META_AI_1ON1,
        forwardScore: 1,
      },
    },
  };
}

function getReelSource(videoUrl) {
  return String(videoUrl || "").includes("tiktok.com") ? "TT" : "IG";
}

function encodeUnifiedResponseData(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64");
}
