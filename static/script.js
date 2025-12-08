const notebookContentHtml = document.getElementById("notebook-content-html");
const modalContentContainer = document.getElementById("modal-content-container");
const modalLoading = document.getElementById("modal-loading");
const notebookModal = document.getElementById("notebook-modal");
const modalTitle = document.getElementById("modal-title");

window.scrollTo(0, 0);

function openNotebookModal(projectId) {
  modalLoading.classList.remove("hidden");
  notebookContentHtml.classList.add("hidden");
  notebookModal.classList.remove("hidden");
  notebookModal.classList.add("flex");

  modalContentContainer.classList.remove("bg-white", "text-gray-800");
  modalContentContainer.classList.add("bg-[#0d1117]", "text-gray-400");

  fetch(`/get_project_data/${projectId}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        modalTitle.textContent = "Error Loading Project";
        notebookContentHtml.textContent = data.error;
      } else {
        modalContentContainer.classList.remove("bg-[#0d1117]", "text-gray-400");
        modalContentContainer.classList.add("bg-white", "text-gray-800");

        modalTitle.textContent = data.title;
        notebookContentHtml.innerHTML = data.ipynb_content;
        if (window.MathJax) {
          MathJax.typesetPromise();
        }
      }

      modalLoading.classList.add("hidden");
      notebookContentHtml.classList.remove("hidden");

      const modalInner = modalContentContainer;
      if (modalInner) modalInner.scrollTop = 0;
      lucide.createIcons();
    })
    .catch((error) => {
      modalTitle.textContent = "Network Error";
      notebookContentHtml.textContent = "Could not load project data due to a network error.";
      modalLoading.classList.add("hidden");
      notebookContentHtml.classList.remove("hidden");
    });
}

function closeNotebookModal(event) {
  if (!event || event.target === notebookModal) {
    notebookModal.classList.remove("flex");
    notebookModal.classList.add("hidden");

    modalContentContainer.classList.remove("bg-white", "text-gray-800");
    modalContentContainer.classList.add("bg-[#0d1117]", "text-gray-400");

    modalTitle.textContent = "";
    notebookContentHtml.innerHTML = "";
  }
}
document.getElementById("menu-button").addEventListener("click", () => {
  document.getElementById("mobile-menu").classList.toggle("hidden");
});

document.querySelectorAll("#mobile-menu a").forEach((link) => {
  link.addEventListener("click", () => {
    document.getElementById("mobile-menu").classList.add("hidden");
  });
});

function initializeSkillChart() {
  const ctx = document.getElementById("skillChart").getContext("2d");

  const labels = ["Python", "ML/DL", "Data Analysis", "SQL/DB", "Java", "Spring", "TypeScript", "Angular", "Cloud/Ops", "Math"];

  const data = [95, 88, 92, 85, 78, 70, 82, 75, 75, 98];

  const colors = ["#3CC4ED", "#F0963C", "#FAE646", "#5AA0FA", "#E06C75", "#D19A66", "#C678DD", "#61AFEF", "#969696", "#50FA7B"];

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Proficiency Score (%)",
          data: data,
          backgroundColor: colors,
          borderColor: "#161b22",
          borderWidth: 1,
          borderRadius: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              let label = context.dataset.label || "";
              if (label) {
                label += ": ";
              }
              label += context.parsed.y + "%";
              return label;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            color: "#c9d1d9",
            callback: function (value) {
              return value + "%";
            },
          },
          grid: {
            color: "#30363d",
          },
          title: {
            display: true,
            text: "Proficiency Level",
            color: "#c9d1d9",
          },
        },
        x: {
          ticks: {
            color: "#c9d1d9",
          },
          grid: {
            display: false,
          },
        },
      },
    },
  });
}

const PROJECT_LIMIT = 4;
const categories = ["ml", "dl", "ds"];

function toggleProjectVisibility(category, showAll) {
  const items = document.querySelectorAll(`.${category}-item`);
  const loadMoreBtn = document.querySelector(`.load-more-btn[data-category='${category}']`);
  const showLessBtn = document.querySelector(`.show-less-btn[data-category='${category}']`);

  if (items.length <= PROJECT_LIMIT) {
    if (loadMoreBtn) loadMoreBtn.classList.add("hidden");
    if (showLessBtn) showLessBtn.classList.add("hidden");
    return;
  }

  items.forEach((item, index) => {
    if (showAll || index < PROJECT_LIMIT) {
      item.style.display = "block";
    } else {
      item.style.display = "none";
    }
  });

  if (showAll) {
    loadMoreBtn.classList.add("hidden");
    showLessBtn.classList.remove("hidden");
  } else {
    loadMoreBtn.classList.remove("hidden");
    showLessBtn.classList.add("hidden");
  }
}

function initializeProjectView() {
  categories.forEach((category) => {
    toggleProjectVisibility(category, false);
  });

  document.querySelectorAll(".load-more-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const category = this.getAttribute("data-category");
      toggleProjectVisibility(category, true);
      lucide.createIcons();
    });
  });

  document.querySelectorAll(".show-less-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const category = this.getAttribute("data-category");
      toggleProjectVisibility(category, false);
      document.getElementById(`${category}-projects`).scrollIntoView({ behavior: "smooth" });
    });
  });
}
const CERT_LIMIT = 6;
const certItems = document.querySelectorAll(".cert-item");
const loadMoreCertBtn = document.getElementById("load-more-cert-btn");
const showLessCertBtn = document.getElementById("show-less-cert-btn");

function toggleCertVisibility(showAll) {
  if (certItems.length <= CERT_LIMIT) {
    loadMoreCertBtn.classList.add("hidden");
    showLessCertBtn.classList.add("hidden");
    return;
  }

  let shownCount = 0;
  certItems.forEach((item, index) => {
    if (showAll || index < CERT_LIMIT) {
      item.style.display = "block";
      shownCount++;
    } else {
      item.style.display = "none";
    }
  });

  if (showAll) {
    loadMoreCertBtn.classList.add("hidden");
    showLessCertBtn.classList.remove("hidden");
  } else {
    loadMoreCertBtn.classList.remove("hidden");
    const hiddenCount = certItems.length - shownCount;
    loadMoreCertBtn.innerHTML = `<i data-lucide="chevrons-down" class="w-5 h-5 inline-block mr-2"></i> Load More`;
    lucide.createIcons();
    showLessCertBtn.classList.add("hidden");
  }
}

function initializeCertView() {
  toggleCertVisibility(false);

  loadMoreCertBtn.addEventListener("click", () => {
    toggleCertVisibility(true);
    lucide.createIcons();
  });

  showLessCertBtn.addEventListener("click", () => {
    toggleCertVisibility(false);
    document.getElementById(`certifications`).scrollIntoView({ behavior: "smooth" });
  });
}

function initializeTopicDropdowns() {
  document.querySelectorAll(".toggle-topics").forEach((button) => {
    button.addEventListener("click", function () {
      const dropdownId = this.getAttribute("data-dropdown-toggle");
      const dropdown = document.getElementById(dropdownId);
      const icon = this.querySelector("i");

      const isCurrentlyHidden = dropdown.classList.contains("hidden");

      document.querySelectorAll(".topics-dropdown").forEach((otherDropdown) => {
        if (!otherDropdown.classList.contains("hidden")) {
          otherDropdown.classList.add("hidden");

          const otherButton = document.querySelector(`[data-dropdown-toggle="${otherDropdown.id}"]`);
          if (otherButton) {
            otherButton.querySelector("i").classList.remove("rotate-180");
          }
        }
      });

      if (isCurrentlyHidden) {
        dropdown.classList.remove("hidden");
        icon.classList.add("rotate-180");
      } else {
        icon.classList.remove("rotate-180");
      }
    });
  });

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".toggle-topics") && !event.target.closest(".topics-dropdown")) {
      document.querySelectorAll(".topics-dropdown").forEach((dropdown) => {
        if (!dropdown.classList.contains("hidden")) {
          dropdown.classList.add("hidden");
          const button = document.querySelector(`[data-dropdown-toggle="${dropdown.id}"]`);
          if (button) {
            button.querySelector("i").classList.remove("rotate-180");
          }
        }
      });
    }
  });
}

async function sendMessage() {
  const inputField = document.getElementById("chat-input");
  const message = inputField.value.trim();
  const messagesContainer = document.getElementById("chat-messages");

  if (message === "") return;

  messagesContainer.innerHTML += `
        <div class="flex justify-end">
            <div class="bg-teal-600 text-white text-sm p-3 rounded-xl rounded-br-none max-w-[80%]">
                ${message}
            </div>
        </div>
    `;
  inputField.value = "";
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  let botThinkingDiv = document.createElement("div");
  botThinkingDiv.className = "flex justify-start";
  botThinkingDiv.innerHTML = `
        <div id="bot-thinking" class="bg-gray-700 text-white text-sm p-3 rounded-xl rounded-bl-none max-w-[80%]">
            Just a moment...
        </div>
    `;
  messagesContainer.appendChild(botThinkingDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  try {
    const response = await fetch("/api/chatbot", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: message }),
    });

    const data = await response.json();
    const botResponse = data.response;

    document.getElementById("bot-thinking").parentNode.remove();

    messagesContainer.innerHTML += `
            <div class="flex justify-start">
                <div class="bg-gray-700 text-white text-sm p-3 rounded-xl rounded-bl-none max-w-[80%]">
                    ${botResponse}
                </div>
            </div>
        `;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  } catch (error) {
    console.error("Erro sending the message:", error);

    const errorMsg = "Error during connection to the server.";
    if (document.getElementById("bot-thinking")) {
      document.getElementById("bot-thinking").parentNode.remove();
    }
    messagesContainer.innerHTML += `
            <div class="flex justify-start">
                <div class="bg-red-700 text-white text-sm p-3 rounded-xl rounded-bl-none max-w-[80%]">
                    ${errorMsg}
                </div>
            </div>
        `;
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

function initializeChatbot() {
  const openBtn = document.getElementById("chat-open-btn");
  const closeBtn = document.getElementById("chat-close-btn");
  const modal = document.getElementById("chat-modal");
  const sendBtn = document.getElementById("chat-send-btn");
  const inputField = document.getElementById("chat-input");

  const bubble = document.getElementById("chat-bubble");

  setTimeout(() => {
    if (bubble) {
      bubble.classList.remove("opacity-0", "pointer-events-none");
      bubble.classList.add("opacity-100");
    }
  }, 1000);

  setTimeout(() => {
    if (bubble && modal.classList.contains("hidden")) {
      bubble.classList.add("opacity-0", "pointer-events-none");
      bubble.classList.remove("opacity-100");
    }
  }, 10000);

  openBtn.addEventListener("click", () => {
    if (modal.classList.contains("hidden")) {
      modal.classList.remove("hidden");

      if (bubble) {
        bubble.classList.add("opacity-0", "pointer-events-none");
        bubble.classList.remove("opacity-100");
      }
    } else {
      modal.classList.add("hidden");
    }
  });
  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  sendBtn.addEventListener("click", sendMessage);

  inputField.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
}

window.onload = function () {
  setTimeout(function () {
    window.scrollTo(0, 0);
  }, 10);
  if (window.location.hash) {
    history.replaceState(null, "", window.location.pathname);
  }
  initializeChatbot();
  lucide.createIcons();
  initializeSkillChart();
  initializeProjectView();
  initializeCertView();
  initializeTopicDropdowns();
};
