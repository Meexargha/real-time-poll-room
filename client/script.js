// Since frontend and backend are served from same server
const API_BASE = "/api/polls";

// Create unique voter ID once
if (!localStorage.getItem("voterId")) {
  localStorage.setItem("voterId", crypto.randomUUID());
}

const voterId = localStorage.getItem("voterId");


// ==========================
// CREATE POLL PAGE
// ==========================
if (document.getElementById("createPoll")) {

  const addBtn = document.getElementById("addOption");
  const createBtn = document.getElementById("createPoll");

  addBtn.onclick = () => {
    const input = document.createElement("input");
    input.className = "option";
    input.placeholder = "New option";
    document.getElementById("options").appendChild(input);
  };

  createBtn.onclick = async () => {
    const question = document.getElementById("question").value.trim();
    const options = [...document.querySelectorAll(".option")]
      .map(o => o.value.trim())
      .filter(o => o !== "");

    if (!question || options.length < 2) {
      alert("Please enter a question and at least 2 options.");
      return;
    }

    createBtn.innerText = "Creating...";
    createBtn.disabled = true;

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, options })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        createBtn.disabled = false;
        createBtn.innerText = "Create Poll";
        return;
      }

      window.location.href = `/poll.html?id=${data.data._id}`;

    } catch (err) {
      alert("Network error. Please try again.");
      createBtn.disabled = false;
      createBtn.innerText = "Create Poll";
    }
  };
}


// ==========================
// POLL PAGE
// ==========================
if (window.location.pathname.includes("poll.html")) {

  const params = new URLSearchParams(window.location.search);
  const pollId = params.get("id");

  const socket = io(); // auto-connect to same host

  socket.emit("joinPoll", pollId);

  const container = document.getElementById("pollOptions");

  let hasVoted = false;

  async function loadPoll() {
    try {
      const res = await fetch(`${API_BASE}/${pollId}`);
      const data = await res.json();

      if (!res.ok) {
        container.innerHTML = `<p style="color:red">${data.message}</p>`;
        return;
      }

      renderPoll(data.data);

    } catch {
      container.innerHTML = `<p style="color:red">Failed to load poll.</p>`;
    }
  }

  function renderPoll(poll) {
    document.getElementById("pollQuestion").innerText = poll.question;

    const totalVotes = poll.options.reduce((sum, o) => sum + o.votes, 0);

    container.innerHTML = "";

    poll.options.forEach((opt, index) => {

      const percent = totalVotes
        ? ((opt.votes / totalVotes) * 100).toFixed(1)
        : 0;

      const div = document.createElement("div");
      div.className = "option-box";

      div.innerHTML = `
        <button ${hasVoted ? "disabled" : ""} onclick="vote(${index})">
          ${opt.text}
        </button>
        <div>${opt.votes} votes (${percent}%)</div>
        <div class="bar" style="width:${percent}%"></div>
      `;

      container.appendChild(div);
    });
  }

  window.vote = async (index) => {
    if (hasVoted) return;

    try {
      const res = await fetch(`${API_BASE}/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          optionIndex: index,
          voterId: voterId
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      hasVoted = true;
      renderPoll(data.data);

    } catch {
      alert("Network error.");
    }
  };

  socket.on("pollUpdated", (updatedPoll) => {
    renderPoll(updatedPoll);
  });

  loadPoll();
}
