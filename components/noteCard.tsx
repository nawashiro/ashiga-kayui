import { Text, Card, Flex, Divider } from "@tremor/react";

export default function NoteCard({ name, url, date, text }: any) {
  return (
    <Card>
      <Flex>
        <Text>{name}</Text>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <Text>
            <time dateTime={date}>{date}</time>
          </Text>
        </a>
      </Flex>
      <Divider />
      <Text>{text}</Text>
    </Card>
  );
}
