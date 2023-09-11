import { ScreenReader } from "@capacitor/screen-reader";
import { v4 as uuidv4 } from "uuid";
import React, { useState, useEffect } from "react";
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
  const [webSocket, setWebSocket] = useState<WebSocket | null>(null); //WebSocket
  const [sessionId, setSessionId] = useState(""); //チャンネルに接続する時のセッションID
  const [formActive, setFormActive] = useState(true); //ドメイン入力フォーム表示フラグ
  const [notes, setNotes] = useState<Object[]>([]); //読み上げるノート
  const [localView, setLocalView] = useState<Object[]>([]); //ローカルタイムライン表示
  const [globalView, setGlobalView] = useState<Object[]>([]); //グローバルタイムライン表示

  //読み上げ関数
  useEffect(() => {
    //発話インターフェイス
    const synth = window.speechSynthesis;

    const intervalId = setInterval(() => {
      //実行中でなければ
      if (!synth.pending) {
        //ノートを取得
        const noteData: any = notes.slice(-1)[0];
        //ノートを削除
        setNotes(notes.slice(0, -1));

        console.log(notes);

        if (noteData != null) {
          console.log("noteData: " + noteData);

          //ノートを表示
          setLocalView((prevNotes) => [noteData, ...prevNotes]);

          //不要部分を削除
          let speakText = noteData.text
            .replace(/(https?|ftp):\/\/[^\s/$.?#].[^\s]*/gi, "") //urlを削除
            .replace(/\$\[.+\]/gi, "") //MFM特殊記号を削除
            .replace(/\*\*/gi, "") //MFM強調記号を削除
            .replace(/\*\*\*/gi, "") //MFM強調記号を削除
            .replace(/_/gi, " ") //「アンダーバー」を削除
            .replace(/#/gi, "ハッシュタグ"); //「いげた」から「ハッシュタグ」に変更
          //発言
          synth.speak(new SpeechSynthesisUtterance(speakText));
        }
      }
    }, 1000);
    return () => clearInterval(intervalId);
  });

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

        if (message.body.type === "note" && message.body.body.text != null) {
          setNotes((prevNotes) => [...prevNotes, message.body.body]);
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
            <Tab>ローカル</Tab>
            <Tab>グローバル</Tab>
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
              <ul>
                {globalView.map((note: any, index) => {
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
          </TabPanels>
        </TabGroup>
      </div>
    </>
  );
}
