import { ScreenReader } from "@capacitor/screen-reader";
import { v4 as uuidv4 } from "uuid";
import React, { useState } from "react";

export default function HomePage() {
  const [host, setHost] = useState(""); //バックエンドのドメイン
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [sessionId, setSessionId] = useState("");

  const speak = async (text: string) => {
    await ScreenReader.speak({ value: text });
  };

  const handleConnect = () => {
    //チェンネルへの接続
    if (host) {
      //セッションIDを設定
      const newSessionId = uuidv4();
      console.log(`sessionId: ${newSessionId}`);

      //ホストを設定
      const newWebSocket = new WebSocket(`wss://${host}/streaming`);

      newWebSocket.onopen = () => {
        setSessionId(newSessionId);
        setWebSocket(newWebSocket);

        const data = {
          type: "connect",
          body: {
            channel: "globalTimeline",
            id: newSessionId,
          },
        };
        newWebSocket.send(JSON.stringify(data));
      };

      // WebSocketメッセージを受信したときの処理
      newWebSocket.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.body.type === "note") {
          const noteData = message.body;
          //console.log("Received note:", noteData);

          //テキストに対する処理
          const noteText = message.body.body.text;
          if (noteText != null) {
            console.log("text:", noteText);
            let speakText = noteText.replace(
              /(https?|ftp):\/\/[^\s/$.?#].[^\s]*/gi,
              ""
            );
            speak(speakText);
          }
        }
      };

      //WebSocketを閉じる
      return () => {
        if (newWebSocket) {
          newWebSocket.close();
        }
      };
    }
  };

  //チャンネルを切断
  const disconnectChannel = () => {
    if (webSocket) {
      const data = {
        type: "disconnect",
        body: {
          id: sessionId,
        },
      };
      webSocket.send(JSON.stringify(data));
      console.log("disconnect");
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleConnect();
  };

  return (
    <>
      <h1>ashiga-kayui</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="example.com"
          value={host}
          onChange={(e) => setHost(e.target.value)}
        ></input>
        <button type="submit">Connect</button>
      </form>
      <button onClick={disconnectChannel}>disconnect</button>
    </>
  );
}
