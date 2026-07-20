import React, { useEffect, useRef, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const POLL_INTERVAL_MS = 4000;

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const lastIdRef = useRef(null);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadInitial = async () => {
    const res = await api.get("/chat");
    setMessages(res.data);
    if (res.data.length > 0) lastIdRef.current = res.data[res.data.length - 1]._id;
    setTimeout(scrollToBottom, 50);
  };

  const pollNew = async () => {
    if (!lastIdRef.current) return;
    const res = await api.get(`/chat?since=${lastIdRef.current}`);
    if (res.data.length > 0) {
      setMessages((prev) => [...prev, ...res.data]);
      lastIdRef.current = res.data[res.data.length - 1]._id;
      setTimeout(scrollToBottom, 50);
    }
  };

  useEffect(() => {
    loadInitial();
    const timer = setInterval(pollNew, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await api.post("/chat", { text });
      setMessages((prev) => [...prev, res.data]);
      lastIdRef.current = res.data._id;
      setText("");
      setTimeout(scrollToBottom, 50);
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout title="Chat">
      <div className="flex h-[70vh] flex-col rounded-xl border border-slate-200 bg-white">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => {
            const isMe = m.sender?._id === user?.id;
            return (
              <div key={m._id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-xs rounded-xl px-3 py-2 text-sm ${isMe ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-800"}`}>
                  {!isMe && <p className="mb-0.5 text-xs font-semibold text-slate-500">{m.sender?.name}</p>}
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            );
          })}
          {messages.length === 0 && <p className="text-center text-sm text-slate-400">No messages yet. Say hello.</p>}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={handleSend} className="flex gap-2 border-t border-slate-100 p-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
          <button
            type="submit"
            disabled={sending}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            Send
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default Chat;
