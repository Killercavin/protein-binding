import React, { useEffect, useState, useRef } from "react";
import { useChannel, useAbly } from "ably/react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { SendIcon } from "lucide-react";
import { useUser } from "../context/UserContext";
import { resizeBase64Img } from "@/lib/utils";
import {
  createGroup,
  getAllGroups,
  addMessageToGroup,
  getGroupMessages,
} from "@/lib/actions/group.actions";
import { getUserByEmail } from "@/lib/actions/user.actions";
import { useSession } from "next-auth/react";

function ChatBox() {
  const ably = useAbly();
  const { data: session } = useSession();
  const user = useUser();
  const bottomRef = useRef(null);

  const [groups, setGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [messageText, setMessageText] = useState("");
  const [receivedMessages, setMessages] = useState([]);
  const [user_, setUser_] = useState(null);

  const channelName = "chat-demo1";
  const { channel } = useChannel(channelName, (message) => {
    if (message.data.group === currentGroup?._id) {
      setMessages((prev) => [...prev, message.data]);
    }
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [receivedMessages]);

  useEffect(() => {
    (async () => {
      setUser_(await getUserByEmail(session?.user?.email));
      setGroups(await getAllGroups());
    })();
  }, [session?.user?.email]);

  const handleCreateGroup = async (groupName) => {
    if (!groupName || groups.some((g) => g.name === groupName)) return;
    const newGroup = await createGroup(groupName, user_._id);
    setGroups([...groups, newGroup]);
    setCurrentGroup(newGroup);
    setMessages([]);
  };

  const handleJoinGroup = async (groupId) => {
    const selectedGroup = groups.find((g) => g._id === groupId);
    if (!selectedGroup) return;
    setCurrentGroup(selectedGroup);
    const messages = await getGroupMessages(groupId);
    setMessages(
      messages.map((msg) => ({
        ...msg,
        connectionId: msg.sender._id,
        name: `${msg.sender.firstName} ${msg.sender.lastName}`,
        image: msg.sender.photo || "/default-avatar.png",
        data: msg.text,
        timestamp: msg.timestamp,
      }))
    );
  };

  const sendChatMessage = async (text) => {
    if (!text.trim() || !currentGroup || !channel) return;
    try {
      const resizedImage = await resizeBase64Img(user.photo, 100, 100);
      const message = {
        group: currentGroup._id,
        name: `${user.firstName} ${user.lastName}`,
        image: resizedImage,
        data: text,
        timestamp: new Date().toISOString(),
        connectionId: ably.connection.id,
      };
      await channel.publish("chat-message", message);
      await addMessageToGroup(currentGroup._id, user_._id, text);
      setMessageText("");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <DefaultLayout>
      <div className="container mx-auto h-screen p-4">
        <h1 className="mb-6 text-3xl text-black dark:text-white">
          Drug Discovery Chat
        </h1>

        <div className="mb-6 flex flex-col sm:flex-row space-y-4 sm:space-x-4">
          <input
            type="text"
            placeholder="Create new group"
            className="input-field"
            onKeyDown={(e) => e.key === "Enter" && handleCreateGroup(e.target.value)}
          />
          <select
            onChange={(e) => handleJoinGroup(e.target.value)}
            className="input-field"
          >
            <option value="">Join a group</option>
            {groups.map((group) => (
              <option key={group._id} value={group._id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        {currentGroup && (
          <div className="chat-container">
            <h2 className="mb-4 text-xl text-black dark:text-white">
              Current Group: {currentGroup.name}
            </h2>
            <div className="chat-box">
              {receivedMessages.length ? (
                <>
                  {receivedMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`message ${
                        message.connectionId === ably.connection.id
                          ? "message-sent"
                          : "message-received"
                      }`}
                    >
                      <div className="flex items-center mb-2">
                        <img
                          src={message.image}
                          alt={message.name}
                          className="avatar"
                        />
                        <span className="text-sm">{message.name}</span>
                      </div>
                      <p className="text-xs">{message.data}</p>
                      <span className="text-gray-400 text-xs">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                  <div ref={bottomRef}></div>
                </>
              ) : (
                <p className="text-gray-500">No messages yet. Start chatting!</p>
              )}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendChatMessage(messageText);
              }}
              className="flex space-x-4"
            >
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="input-field"
              />
              <button
                type="submit"
                disabled={!messageText.trim()}
                className="send-button"
              >
                <SendIcon className="mr-2" />
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}

export default ChatBox;
