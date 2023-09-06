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
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Callout,
} from "@tremor/react";
import NoteCard from "@/components/noteCard";

export default function HomePage() {
  const [host, setHost] = useState("misskey.io"); //バックエンドのドメイン
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [localNotes, setLocalNotes] = useState<Object[]>([]);
  const [localView, setLocalView] = useState<Object[]>([]);

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
          const noteData = message.body.body;

          //テキストに対する処理
          const noteText = noteData.text;
          if (noteText != null) {
            //ノートを保存
            setLocalNotes((prevNotes) => [...prevNotes, noteData]);
            setLocalView((prevNotes) => [noteData, ...prevNotes]);

            console.log(noteData);

            console.log("text:", noteText);
            let speakText = noteText
              .replace(/(https?|ftp):\/\/[^\s/$.?#].[^\s]*/gi, "")
              .replace(/\$\[.+\]/gi, "")
              .replace(/_/gi, " ")
              .replace(/#/gi, "ハッシュタグ");
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
        <Title className="margin-top">ashiga-kayui</Title>

        <Card>
          <Subtitle>これはなに？</Subtitle>
          <Text>
            ashiga-kayuiはMisskeyの投稿を自動読み上げするアプリです。
            <br />
            ログイン不要で使用することができます。
          </Text>
          <Callout title="警告">
            これはテスト版であり、さまざまなものがテープで仮止めされている状態です。
          </Callout>
        </Card>

        <Card>
          <Subtitle>サーバーへ接続</Subtitle>
          {formActive ? (
            <form onSubmit={handleSubmit}>
              <Text>好きなMisskeyサーバーのドメインを入力してください。</Text>
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

        <TabGroup>
          <TabList variant="solid">
            <Tab>Local</Tab>
            <Tab>Global</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <ul>
                {localView.map((note: any, index) => {
                  return (
                    <NoteCard
                      name={note.user.name}
                      url={`https://${host}/notes/${note.id}`}
                      date={note.createdAt}
                      text={note.text}
                      key={index}
                    />
                  );
                })}
              </ul>
            </TabPanel>
            <TabPanel>
              <Callout title="警告">未対応です。</Callout>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    </>
  );
}
