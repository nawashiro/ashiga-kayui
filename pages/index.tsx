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
  Accordion,
  AccordionHeader,
  AccordionBody,
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
  const [channel, setChannel] = useState<number>(0); //タブ

  //発話インターフェイス
  const synth = window.speechSynthesis;

  //読み上げ関数
  useEffect(() => {
    const intervalId = setInterval(() => {
      //発言中でないかつキューに何もなければ
      if (!synth.speaking && !synth.pending) {
        //ノートを取得
        const noteData: any = notes.slice(-1)[0];
        //ノートを削除
        setNotes(notes.slice(0, -1));

        console.log(notes);

        if (noteData != null) {
          console.log(noteData);

          //ノートを表示
          if (noteData.channel == 0) {
            setLocalView((prevNotes) => [noteData, ...prevNotes]);
          } else {
            setGlobalView((prevNotes) => [noteData, ...prevNotes]);
          }
          //不要部分を削除
          let speakText =
            `${
              noteData.user.name ? noteData.user.name : noteData.user.username
            }さん、` + noteData.text;
          speakText = speakText
            .replace(/(https?|ftp):\/\/[^\s/$.?#].[^\s]*/gi, "") //urlを削除
            .replace(/\$\[.+\]/gi, "") //MFM特殊記号を削除
            .replace(/\*\*/gi, "") //MFM強調記号を削除
            .replace(/\*\*\*/gi, "") //MFM強調記号を削除
            .replace(/_/gi, " ") //「アンダーライン」を削除
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

        setChannel((preChannel) => {
          const data = {
            type: "connect",
            body: {
              channel: preChannel ? "globalTimeline" : "localTimeline",
              id: newSessionId,
            },
          };
          newWebSocket.send(JSON.stringify(data));

          return preChannel;
        });
      };

      // WebSocketメッセージを受信したときの処理
      newWebSocket.onmessage = (event) => {
        let message = JSON.parse(event.data);

        setChannel((preChannel) => {
          message.body.body.channel = preChannel;
          return preChannel;
        });

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
      webSocket.close();
      setWebSocket(null);

      console.log("disconnect");
    }
  };

  //ドメイン入力
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleConnect();
  };

  //タブ切り替え
  const handleChannelSelected = (e: number) => {
    setChannel(e);
    if (webSocket) {
      disconnectChannel();
      handleConnect();
    }
  };

  const speakSkip = () => {
    synth.cancel();
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
          <Callout title="警告" className="margin-top">
            これはテスト版であり、さまざまなものがテープで仮止めされている状態です。
          </Callout>
        </Card>

        <Card>
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
            <>
              <Button onClick={disconnectChannel} className="margin-right">
                切断
              </Button>
              <Button onClick={speakSkip}>読み上げをスキップ</Button>
            </>
          )}

          <Accordion className="margin-top">
            <AccordionHeader>設定</AccordionHeader>
            <AccordionBody>
              <Callout title="警告">未対応です。</Callout>
            </AccordionBody>
          </Accordion>
        </Card>

        <TabGroup
          defaultIndex={channel}
          onIndexChange={(e) => handleChannelSelected(e)}
        >
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
                      name={
                        note.user.name ? note.user.name : note.user.username
                      }
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
                      name={
                        note.user.name ? note.user.name : note.user.username
                      }
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
