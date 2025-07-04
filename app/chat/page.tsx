"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  speaker?: string;
}

interface TodoItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: Date;
}

interface Contact {
  id: string;
  name: string;
  details: string;
  createdAt: Date;
}

interface Meeting {
  id: string;
  title: string;
  datetime: string;
  details: string;
  createdAt: Date;
}

interface Specification {
  id: string;
  title: string;
  type: string;
  content: string;
  createdAt: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // State variables for data visualization
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [activeTab, setActiveTab] = useState<"todos" | "contacts" | "specs">(
    "todos"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date(),
      speaker: "あなた",
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: messageToSend }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();

      // Handle tool executions (show toast for actions and update state)
      if (data.tools) {
        data.tools.forEach((tool: any) => {
          if (tool.showToast) {
            toast.success(tool.message || "操作が完了しました");
          }

          // Update state based on tool data
          if (tool.speaker === "TODO管理係" && tool.data) {
            if (tool.data.title) {
              const newTodo: TodoItem = {
                id: tool.data.id || Date.now().toString(),
                title: tool.data.title,
                description: tool.data.description,
                completed: false,
                createdAt: new Date(),
              };
              setTodos((prev) => [...prev, newTodo]);
            }
          } else if (tool.speaker === "連絡管理係" && tool.data) {
            if (tool.data.contactName) {
              const newContact: Contact = {
                id: Date.now().toString(),
                name: tool.data.contactName,
                details: tool.data.details || "",
                createdAt: new Date(),
              };
              setContacts((prev) => [...prev, newContact]);
            } else if (tool.data.meetingTitle) {
              const newMeeting: Meeting = {
                id: Date.now().toString(),
                title: tool.data.meetingTitle,
                datetime: tool.data.datetime || "",
                details: tool.data.details || "",
                createdAt: new Date(),
              };
              setMeetings((prev) => [...prev, newMeeting]);
            }
          } else if (tool.speaker === "仕様書管理係" && tool.data) {
            if (tool.data.title) {
              const newSpec: Specification = {
                id: Date.now().toString(),
                title: tool.data.title,
                type: tool.data.type || "未分類",
                content: tool.data.content || "",
                createdAt: new Date(),
              };
              setSpecifications((prev) => [...prev, newSpec]);
            }
          }
        });
      }

      // Add boss response
      const bossMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        isUser: false,
        timestamp: new Date(),
        speaker: data.speaker || "ボス",
      };

      let allMessages = [bossMessage];

      // Only add tool messages (these contain the actual agent responses)
      // Don't add agentResponses as they might be duplicates
      if (data.tools) {
        data.tools.forEach((tool: any, index: number) => {
          if (tool.message && tool.speaker) {
            const toolMessage: Message = {
              id: (Date.now() + index + allMessages.length + 1).toString(),
              content: tool.message,
              isUser: false,
              timestamp: new Date(),
              speaker: tool.speaker,
            };
            allMessages.push(toolMessage);
          }
        });
      }

      setMessages((prev) => [...prev, ...allMessages]);
    } catch (error) {
      console.error("Error calling chat API:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error. Please try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Left Panel - Chat */}
      <div className="w-1/2 flex flex-col">
        <div className="bg-white shadow-lg h-full flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
            <h1 className="text-xl font-semibold">AI エージェントチーム</h1>
            <div className="flex gap-2 mt-2">
              <span className="text-xs bg-white/20 px-2 py-1 rounded">
                👔 ボス
              </span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded">
                📝 TODO管理係
              </span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded">
                📞 連絡管理係
              </span>
              <span className="text-xs bg-white/20 px-2 py-1 rounded">
                📋 仕様書管理係
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <p>メッセージはまだありません</p>
              </div>
            ) : (
              messages.map((message) => {
                const getSpeakerColor = (speaker?: string) => {
                  switch (speaker) {
                    case "ボス":
                      return "bg-purple-600 text-white";
                    case "TODO管理係":
                      return "bg-green-500 text-white";
                    case "連絡管理係":
                      return "bg-orange-500 text-white";
                    case "仕様書管理係":
                      return "bg-indigo-500 text-white";
                    case "あなた":
                      return "bg-blue-600 text-white";
                    default:
                      return "bg-gray-200 text-gray-800";
                  }
                };

                const getSpeakerIcon = (speaker?: string) => {
                  switch (speaker) {
                    case "ボス":
                      return "👔";
                    case "TODO管理係":
                      return "📝";
                    case "連絡管理係":
                      return "📞";
                    case "仕様書管理係":
                      return "📋";
                    case "あなた":
                      return "👤";
                    default:
                      return "🤖";
                  }
                };

                return (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.isUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className="max-w-2xl">
                      {!message.isUser && (
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">
                            {getSpeakerIcon(message.speaker)}
                          </span>
                          <span className="text-sm font-medium text-gray-600">
                            {message.speaker}
                          </span>
                        </div>
                      )}
                      <div
                        className={`px-4 py-3 rounded-lg ${getSpeakerColor(
                          message.speaker
                        )}`}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs opacity-75">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                          {message.isUser && (
                            <span className="text-xs opacity-75 flex items-center gap-1">
                              👤 あなた
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-2xl">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">👔</span>
                    <span className="text-sm font-medium text-gray-600">
                      ボス
                    </span>
                  </div>
                  <div className="bg-gray-200 text-gray-800 px-4 py-3 rounded-lg">
                    <div className="flex items-center gap-1 mt-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-6 bg-gradient-to-r from-purple-50 to-blue-50">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="ボスに依頼をください"
                className="flex-1 px-4 py-3 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                送信
              </button>
            </form>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setInputValue("新しいTODOを作成してください")}
                className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200"
                disabled={isLoading}
              >
                📝 TODO作成
              </button>
              <button
                onClick={() =>
                  setInputValue("来週の会議をスケジュールしてください")
                }
                className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full hover:bg-orange-200"
                disabled={isLoading}
              >
                📞 会議予約
              </button>
              <button
                onClick={() => setInputValue("API仕様書を作成してください")}
                className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full hover:bg-indigo-200"
                disabled={isLoading}
              >
                📋 仕様書作成
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Data Visualization */}
      <div className="w-1/2 bg-white shadow-lg flex flex-col">
        {/* Right Panel Header */}
        <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white p-4">
          <h1 className="text-xl font-semibold">データ管理</h1>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setActiveTab("todos")}
              className={`text-xs px-3 py-1 rounded ${
                activeTab === "todos"
                  ? "bg-white text-gray-700"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              📝 TODO ({todos.length})
            </button>
            <button
              onClick={() => setActiveTab("contacts")}
              className={`text-xs px-3 py-1 rounded ${
                activeTab === "contacts"
                  ? "bg-white text-gray-700"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              📞 連絡 ({contacts.length + meetings.length})
            </button>
            <button
              onClick={() => setActiveTab("specs")}
              className={`text-xs px-3 py-1 rounded ${
                activeTab === "specs"
                  ? "bg-white text-gray-700"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              📋 仕様書 ({specifications.length})
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "todos" && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                TODO リスト
              </h2>
              {todos.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  まだTODOがありません
                </p>
              ) : (
                todos.map((todo) => (
                  <div
                    key={todo.id}
                    className="bg-green-50 p-3 rounded-lg border border-green-200"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-green-800">
                        {todo.title}
                      </h3>
                      <button
                        onClick={() => {
                          setTodos((prev) =>
                            prev.map((t) =>
                              t.id === todo.id
                                ? { ...t, completed: !t.completed }
                                : t
                            )
                          );
                        }}
                        className={`text-xs px-2 py-1 rounded ${
                          todo.completed
                            ? "bg-green-600 text-white"
                            : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                        }`}
                      >
                        {todo.completed ? "✅ 完了" : "⭕ 未完了"}
                      </button>
                    </div>
                    {todo.description && (
                      <p className="text-sm text-green-600 mt-1">
                        {todo.description}
                      </p>
                    )}
                    <p className="text-xs text-green-500 mt-2">
                      作成: {todo.createdAt.toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "contacts" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                連絡管理
              </h2>

              {/* Contacts Section */}
              <div>
                <h3 className="text-md font-medium text-orange-800 mb-2">
                  📞 連絡先
                </h3>
                {contacts.length === 0 ? (
                  <p className="text-gray-500 text-sm">連絡先がありません</p>
                ) : (
                  <div className="space-y-2">
                    {contacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="bg-orange-50 p-3 rounded border border-orange-200"
                      >
                        <h4 className="font-medium text-orange-800">
                          {contact.name}
                        </h4>
                        <p className="text-sm text-orange-600">
                          {contact.details}
                        </p>
                        <p className="text-xs text-orange-500 mt-1">
                          登録: {contact.createdAt.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Meetings Section */}
              <div>
                <h3 className="text-md font-medium text-orange-800 mb-2">
                  📅 会議予定
                </h3>
                {meetings.length === 0 ? (
                  <p className="text-gray-500 text-sm">会議予定がありません</p>
                ) : (
                  <div className="space-y-2">
                    {meetings.map((meeting) => (
                      <div
                        key={meeting.id}
                        className="bg-orange-50 p-3 rounded border border-orange-200"
                      >
                        <h4 className="font-medium text-orange-800">
                          {meeting.title}
                        </h4>
                        <p className="text-sm text-orange-600">
                          📅 {meeting.datetime}
                        </p>
                        {meeting.details && (
                          <p className="text-sm text-orange-600">
                            {meeting.details}
                          </p>
                        )}
                        <p className="text-xs text-orange-500 mt-1">
                          作成: {meeting.createdAt.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "specs" && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                仕様書管理
              </h2>
              {specifications.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  仕様書がありません
                </p>
              ) : (
                specifications.map((spec) => (
                  <div
                    key={spec.id}
                    className="bg-indigo-50 rounded-lg border border-indigo-200 overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-3 bg-indigo-100 border-b border-indigo-200">
                      <h3 className="font-medium text-indigo-800">
                        {spec.title}
                      </h3>
                      <span className="text-xs bg-indigo-200 text-indigo-700 px-2 py-1 rounded">
                        {spec.type}
                      </span>
                    </div>
                    {spec.content && (
                      <div className="p-4 bg-white max-h-96 overflow-y-auto">
                        <div
                          className="prose prose-sm max-w-none
                            prose-headings:text-indigo-800 
                            prose-p:text-gray-700 
                            prose-li:text-gray-700
                            prose-strong:text-indigo-700
                            prose-code:text-pink-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded
                            prose-pre:bg-gray-900 prose-pre:text-gray-100
                            prose-table:text-sm
                            prose-th:bg-gray-100 prose-th:text-gray-800
                            prose-td:border-gray-300"
                        >
                          <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                            {spec.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}
                    <div className="p-3 bg-indigo-50 border-t border-indigo-200">
                      <p className="text-xs text-indigo-500">
                        作成: {spec.createdAt.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
