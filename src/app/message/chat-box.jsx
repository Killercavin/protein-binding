import React, { useEffect, useState, useRef } from "react";
import { useChannel, useAbly } from "ably/react";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import { SendIcon, PlusCircleIcon, UsersIcon } from "lucide-react";
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
  const [showGroupInput, setShowGroupInput] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

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
    setShowGroupInput(false);
    setNewGroupName("");
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
      <div className="container mx-auto max-w-4xl h-screen p-4 flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl shadow-lg">
          <h1 className="text-3xl font-bold flex items-center">
            <UsersIcon className="mr-3" />
            Drug Discovery Chat
          </h1>
        </div>

        <div className="flex-grow bg-white dark:bg-gray-800 shadow-md">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-4">
            {!showGroupInput ? (
              <button 
                onClick={() => setShowGroupInput(true)}
                className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
              >
                <PlusCircleIcon className="mr-2" />
                Create Group
              </button>
            ) : (
              <div className="flex space-x-2 w-full">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="flex-grow px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => 
                    e.key === "Enter" && handleCreateGroup(newGroupName)
                  }
                />
                <button
                  onClick={() => handleCreateGroup(newGroupName)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowGroupInput(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            )}

            <select
              onChange={(e) => handleJoinGroup(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="flex flex-col h-[calc(100vh-300px)]">
              <div className="p-4 bg-gray-100 dark:bg-gray-900 border-b">
                <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                  Current Group: {currentGroup.name}
                </h2>
              </div>

              <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {receivedMessages.length ? (
                  <>
                    {receivedMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.connectionId === ably.connection.id
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xl p-3 rounded-lg shadow-md ${
                            message.connectionId === ably.connection.id
                              ? "bg-blue-500 text-white"
                              : "bg-gray-200 dark:bg-gray-700"
                          }`}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <img
                              src={message.image}
                              alt={message.name}
                              className="w-8 h-8 rounded-full border-2 border-white"
                            />
                            <span className="font-semibold text-sm">
                              {message.name}
                            </span>
                          </div>
                          <p className="text-sm">{message.data}</p>
                          <span className="text-xs opacity-70 block text-right mt-1">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div ref={bottomRef}></div>
                  </>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400">
                    No messages yet. Start chatting!
                  </p>
                )}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendChatMessage(messageText);
                }}
                className="p-4 bg-white dark:bg-gray-800 border-t flex items-center space-x-4"
              >
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-grow px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <SendIcon className="mr-2" />
                  Send
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </DefaultLayout>
  );
}

export default ChatBox;