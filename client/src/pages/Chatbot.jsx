import { useState } from "react";
import axios from "axios";
import { MessageCircle, Send, Sparkles } from "lucide-react";
import AppNavbar from "../components/AppNavbar";
import "../styles/Chatbot.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Chatbot() {
  const user = JSON.parse(localStorage.getItem("vogue-ai-user") || "{}");
  const userInitials = user.name?.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "V";
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const quickPrompts = ["Mehndi Outfit Ideas", "Raw Silk Pairing", "Warm Spring Palette", "Capsule Wardrobe Rules"];

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) return;

    const history = messages.map(({ role, content }) => ({ role, content }));
    setLoading(true);
    setError("");
    setMessages((currentMessages) => [
      ...currentMessages,
      { role: "user", content: trimmedQuestion },
    ]);
    setQuestion("");

    try {
      const response = await axios.post(`${API_BASE_URL}/api/chat-rag`, {
        question: trimmedQuestion,
        history,
      });

      if (!response.data?.success) {
        throw new Error(response.data?.error || "The style assistant could not respond.");
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          role: "assistant",
          content: response.data.data.guidance,
          data: response.data.data,
        },
      ]);
    } catch (requestError) {
      setQuestion(trimmedQuestion);
      setMessages((currentMessages) => currentMessages.slice(0, -1));
      setError(requestError.response?.data?.error || requestError.message || "Unable to reach the style assistant.");
    } finally {
      setLoading(false);
    }
  };

  const useQuickPrompt = (prompt) => {
    setQuestion(prompt);
  };

  const handleQuestionKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <main className="chatbot-page">
      <AppNavbar activeItem="chatbot" />

      <section className={`chatbot-layout ${messages.length || loading ? "has-messages" : "is-empty"}`}>
        <section className="chatbot-shell" aria-live="polite">
          <div className="chatbot-result">
          {!messages.length && !loading && (
            <div className="chatbot-empty">
              <Sparkles size={24} strokeWidth={1.3} />
              <h1 className="chatbot-empty-title">Vogue AI Assistant</h1>
              <h2>How can I style you today?</h2>
              <p>Ask about outfits, fit, fabrics, occasions, or color.</p>
            </div>
          )}
          {loading && <p className="chatbot-status">Searching the research library...</p>}
          {messages.length > 0 && (
            <div className="chatbot-thread">
              {messages.map((message, index) => (
                <article className={`chatbot-message chatbot-message-${message.role}`} key={`${message.role}-${index}`}>
                  {message.role === "user" ? (
                    <div className="chatbot-user-row">
                      <div className="chatbot-user-bubble chatbot-guidance">{message.content}</div>
                      <span className="chatbot-user-avatar" aria-label="Your message">{userInitials}</span>
                    </div>
                  ) : (
                    <div className="chatbot-assistant-row">
                      <span className="chatbot-ai-avatar" aria-label="Vogue AI">V</span>
                      <div className="chatbot-assistant-content">
                        <p className="chatbot-message-label">Vogue AI Assistant</p>
                        <div className="chatbot-guidance">{message.content}</div>
                      </div>
                    </div>
                  )}
                </article>
              ))}
              {loading && <p className="chatbot-status">Thinking through your question...</p>}
            </div>
          )}
          </div>

          <form className="chatbot-form" onSubmit={handleSubmit}>
            <MessageCircle size={18} strokeWidth={1.5} aria-hidden="true" />
            <label className="sr-only" htmlFor="question">Your question</label>
            <textarea
              id="question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={handleQuestionKeyDown}
              placeholder="Ask Vogue AI about style, fit, color, fabrics..."
              rows={1}
            />
            <button type="submit" disabled={loading || !question.trim()} aria-label="Send question">
              <Send size={16} aria-hidden="true" />
            </button>
            {error && <p className="chatbot-error" role="alert">{error}</p>}
          </form>
          <div className="chatbot-quick-prompts" aria-label="Suggested questions">
            {quickPrompts.map((prompt) => (
              <button type="button" key={prompt} onClick={() => useQuickPrompt(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}