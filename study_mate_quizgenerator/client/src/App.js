import React, { useRef, useState } from "react";

// Theme colors from container spec
const COLORS = {
  primary: "#000",
  secondary: "#40916C",
  accent: "#FFD166",
  bg: "#181A1B",
  card: "#232526",
  text: "#EAEAEA",
  correct: "#35c759",
  wrong: "#ff4e42",
};

function FileUpload({ onQuizLoaded, onError, loading, setLoading }) {
  const fileInput = useRef();
  const [progress, setProgress] = useState(null);

  const handleFileChange = async (e) => {
    if (!e.target.files || e.target.files.length < 1) return;
    const file = e.target.files[0];
    // Accept only PDF/DOCX
    if (!["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(file.type)) {
      onError("Only PDF or DOCX files are allowed.");
      return;
    }
    setProgress(0);
    setLoading(true);
    onError("");
    try {
      const form = new FormData();
      form.append("file", file);

      // Track upload progress
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload");
      xhr.responseType = "json";
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 80));
      };
      xhr.onload = () => {
        setProgress(100);
        setLoading(false);
        if (xhr.status >= 400) {
          onError(xhr.response?.message || "Failed to upload/process file.");
        } else if (xhr.response && xhr.response.status === "success") {
          onQuizLoaded({
            quizId: xhr.response.quizId,
            quiz: xhr.response.quiz
          });
        } else {
          onError(xhr.response?.message || "Unexpected server response.");
        }
      };
      xhr.onerror = () => {
        setLoading(false);
        onError("Failed to contact server.");
      };
      xhr.send(form);
    } catch (err) {
      setLoading(false);
      onError("An error occurred during upload.");
    }
  };

  return (
    <div style={{
      background: COLORS.card,
      border: `2px dashed ${COLORS.secondary}`,
      borderRadius: 16,
      padding: "2rem",
      textAlign: "center",
      margin: "2rem auto",
      maxWidth: 430
    }}>
      <input
        ref={fileInput}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        style={{ display: "none" }}
        onChange={handleFileChange}
        disabled={loading}
      />
      <h3 style={{ color: COLORS.text }}>Upload Study Material</h3>
      <p style={{ color: COLORS.secondary }}>PDF or Word .docx files only.<br />Max 8MB.</p>
      <button
        style={{
          background: COLORS.secondary,
          color: COLORS.text,
          border: "none",
          borderRadius: 8,
          padding: "0.8rem 2rem",
          cursor: loading ? "not-allowed" : "pointer",
          fontWeight: 700,
          fontSize: 18,
          marginTop: 16
        }}
        onClick={() => fileInput.current.click()}
        disabled={loading}>
        {loading ? "Uploading..." : "Choose File"}
      </button>
      {progress !== null && (
        <div style={{ marginTop: 16 }}>
          <div style={{
            background: "#373737",
            borderRadius: 8,
            height: 8,
            width: 200,
            margin: "0 auto"
          }}>
            <div style={{
              background: COLORS.accent,
              width: `${progress}%`,
              height: "100%",
              borderRadius: 8,
              transition: "width 0.4s"
            }} />
          </div>
          <span style={{ color: COLORS.text, fontSize: 14 }}>
            {progress < 100 ? `Processing... (${progress}%)` : "Done!"}
          </span>
        </div>
      )}
    </div>
  );
}

function MCQCard({ question, options, selected, feedback, onOption, disabled, correctOption, explanation }) {
  return (
    <div style={{
      background: COLORS.card,
      color: COLORS.text,
      margin: "1.5rem auto",
      padding: "1.25rem 1.5rem 0.8rem",
      borderRadius: 14,
      maxWidth: 520,
      boxShadow: "0 2px 18px #00000033"
    }}>
      <div style={{ fontWeight: "bold", fontSize: 18, marginBottom: 12, color: COLORS.accent }}>
        {question}
      </div>
      <div>
        {options.map((opt, i) => {
          let optFeedbackStyle = {};
          if (feedback) {
            if (selected === opt) {
              optFeedbackStyle.background = feedback === "correct" ? COLORS.correct : COLORS.wrong;
              optFeedbackStyle.color = "#fff";
              optFeedbackStyle.fontWeight = 700;
            } else if (opt === correctOption) {
              optFeedbackStyle.background = "#319252";
              optFeedbackStyle.color = "#fff";
              optFeedbackStyle.fontWeight = 700;
            }
          }
          return (
            <button
              key={opt}
              onClick={() => !disabled && onOption(opt)}
              disabled={disabled}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                background: optFeedbackStyle.background || "#24262c",
                color: optFeedbackStyle.color || COLORS.text,
                border: `1px solid ${COLORS.secondary}`,
                borderRadius: 8,
                padding: "0.65rem 1.2rem",
                marginBottom: 9,
                cursor: disabled ? "not-allowed" : "pointer",
                fontSize: 16,
                transition: "background 0.3s, color 0.3s",
                fontWeight: optFeedbackStyle.fontWeight || 500
              }}
              aria-pressed={selected === opt}
              tabIndex={0}
            >{opt}</button>
          );
        })}
      </div>
      {feedback &&
        <div style={{
          marginTop: 10,
          color: feedback === "correct" ? COLORS.correct : COLORS.wrong,
          fontWeight: 700,
          fontSize: 16
        }}>
          {feedback === "correct" ? "Correct!" : "Incorrect"}
          {explanation && <div style={{
            fontWeight: 400,
            fontSize: 15,
            color: COLORS.text,
            marginTop: 6
          }}>{explanation}</div>}
        </div>
      }
    </div>
  );
}

function QuizView({ quizId, quiz }) {
  const [mcqStates, setMcqStates] = useState(() =>
    quiz.mcqs.map(() => ({
      selected: null,
      feedback: null,
      correctOption: undefined,
      explanation: '',
      loading: false
    }))
  );

  // For a given MCQ index, send answer and update card state
  const handleAnswer = (mcqIndex, selectedOption) => {
    // Prevent answer spam
    if (mcqStates[mcqIndex]?.loading) return;

    setMcqStates((old) =>
      old.map((state, idx) => (idx === mcqIndex ? { ...state, loading: true } : state))
    );

    fetch(`/api/quiz/${encodeURIComponent(quizId)}/answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ mcqIndex, selectedOption })
    })
      .then(async (r) => ({
        ok: r.ok,
        status: r.status,
        data: await r.json()
      }))
      .then(({ ok, data }) => {
        setMcqStates((old) =>
          old.map((state, idx) =>
            idx === mcqIndex
              ? {
                  ...state,
                  selected: selectedOption,
                  feedback: ok && data.status === "success" ? data.result : "error",
                  explanation: ok && data.status === "success" ? data.explanation : (data.message || ""),
                  correctOption: ok && data.status === "success" ? data.correctOption : undefined,
                  loading: false
                }
              : state
          )
        );
      })
      .catch(() => {
        setMcqStates((old) =>
          old.map((state, idx) =>
            idx === mcqIndex ? { ...state, feedback: "error", explanation: "Error contacting server.", loading: false } : state
          )
        );
      });
  };

  return (
    <div>
      <h2 style={{
        color: COLORS.secondary,
        fontSize: 26,
        fontWeight: 800,
        textAlign: "center",
        marginTop: 30,
        marginBottom: 10
      }}>
        {quiz.title || "Quiz"}
      </h2>
      <div style={{
        color: COLORS.text,
        textAlign: "center",
        margin: "0 0 24px"
      }}>
        {quiz.mcqs.length} Question{quiz.mcqs.length !== 1 ? "s" : ""}
      </div>

      {quiz.mcqs.map((mcq, idx) => (
        <MCQCard
          key={idx}
          question={mcq.question}
          options={mcq.options}
          selected={mcqStates[idx]?.selected}
          feedback={mcqStates[idx]?.feedback}
          correctOption={mcqStates[idx]?.correctOption}
          explanation={mcqStates[idx]?.explanation}
          disabled={mcqStates[idx]?.feedback != null || mcqStates[idx]?.loading}
          onOption={(opt) => handleAnswer(idx, opt)}
        />
      ))}
    </div>
  );
}

export default function App() {
  const [quizSession, setQuizSession] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setQuizSession(null);
    setError("");
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.bg,
      color: COLORS.text,
      fontFamily: "'Inter', Arial, sans-serif"
    }}>
      <div style={{
        maxWidth: 680,
        margin: "0 auto",
        padding: "1rem 16px"
      }}>
        <header style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginTop: 28,
          marginBottom: 27,
        }}>
          <span style={{
            display: "inline-block",
            width: 38,
            height: 38,
            borderRadius: 13,
            background: COLORS.secondary,
            color: "#fff",
            textAlign: "center",
            fontWeight: 900,
            fontSize: 25,
            lineHeight: "38px"
          }}>QG</span>
          <span style={{
            fontWeight: 700,
            fontSize: 24,
            color: COLORS.text
          }}>StudyMate QuizGenerator</span>
        </header>

        {!quizSession && (
          <FileUpload
            onQuizLoaded={setQuizSession}
            onError={setError}
            loading={loading}
            setLoading={setLoading}
          />
        )}

        {error && <div style={{
          color: "#ff4040",
          background: "#232323",
          borderRadius: 7,
          padding: "0.7rem 1rem",
          margin: "18px auto 0",
          fontSize: 15,
          fontWeight: 500,
          maxWidth: 540
        }}>{error}</div>}

        {quizSession && (
          <div>
            <QuizView quizId={quizSession.quizId} quiz={quizSession.quiz} />
            <div style={{ textAlign: "center", margin: "2.6rem 0 1.4rem" }}>
              <button onClick={reset} style={{
                background: COLORS.primary,
                color: COLORS.accent,
                border: `1.5px solid ${COLORS.accent}`,
                borderRadius: 8,
                padding: "0.6rem 2.4rem",
                fontWeight: 700,
                fontSize: 17,
                marginRight: 8,
                cursor: "pointer"
              }}>Upload Another</button>
            </div>
          </div>
        )}

        <footer style={{
          margin: "2rem auto 1rem",
          textAlign: "center",
          fontSize: "14px",
          color: "#6e6e6e"
        }}>
          &copy; {new Date().getFullYear()} StudyMate QuizGenerator &ndash; a student project.
        </footer>
      </div>
    </div>
  );
}
