import { ScreenReader } from "@capacitor/screen-reader";
import { v4 as uuidv4 } from "uuid";
import React, { useState } from "react";
import {
  Title,
  Text,
  Card,
  TextInput,
  Button,
  Subtitle,
  Flex,
  Metric,
} from "@tremor/react";

export default function HomePage() {
  const [host, setHost] = useState(""); //バックエンドのドメイン
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [formActive, setFormActive] = useState(true);

  const speak = async (text: string) => {
    await ScreenReader.speak({ value: text });
  };

  const handleConnect = () => {
    //チェンネルへの接続
    if (host) {
      //フォームを切り替える
      setFormActive(false);

      //セッションIDを設定
      const newSessionId = uuidv4();
      console.log(`sessionId: ${newSessionId}`);

      //ホストを設定
      const newWebSocket = new WebSocket(`wss://${host}/streaming`);

      //接続リクエスト送信
      newWebSocket.onopen = () => {
        setSessionId(newSessionId);
        setWebSocket(newWebSocket);

        const data = {
          type: "connect",
          body: {
            channel: "localTimeline",
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
    //フォーム切り替え
    setFormActive(true);

    //切断リクエスト送信
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
      <div className="wrapcontent">
        <Title>ashiga-kayui</Title>

        <Card>
          <Subtitle>これはなに？</Subtitle>
          <Text>
            ashiga-kayuiはMisskeyの投稿を自動読み上げするアプリです。
            <br />
            ログイン不要で使用することができます。
          </Text>
        </Card>

        <Card>
          <Subtitle>サーバーへ接続</Subtitle>
          {formActive ? (
            <form onSubmit={handleSubmit}>
              <Text>好きなMisskeyサーバーのドメイン名を入力してください。</Text>
              <Flex>
                <TextInput
                  type="text"
                  placeholder="example.com"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                ></TextInput>
                <Button type="submit">接続</Button>
              </Flex>
            </form>
          ) : (
            <Button onClick={disconnectChannel}>切断</Button>
          )}
        </Card>
      </div>
    </>
  );
}
