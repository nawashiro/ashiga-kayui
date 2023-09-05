import { Text, Card, Flex, Divider } from "@tremor/react";
import { format } from "date-fns";
import ja from "date-fns/locale/ja";

export default function NoteCard({ name, url, date, text }: any) {
  return (
    <Card>
      <Flex>
        <Text>{name}</Text>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Text>
            <time dateTime={date}>
              {format(new Date(date), "y/M/d H:m:s", {
                locale: ja,
              })}
            </time>
          </Text>
        </a>
      </Flex>
      <Divider />
      <Text>{text}</Text>
    </Card>
  );
}
