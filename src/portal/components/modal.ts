export function modalContainer() {
  return `
    <div
      id="portal-modal"
      style="
        display:none;
        position:fixed;
        inset:0;
        z-index:9999;
        align-items:center;
        justify-content:center;
        padding:24px;
        background:rgba(15,23,42,.55);
      "
      onclick="closePortalModal(event)"
    >

      <div
        id="portal-modal-content"
        style="
  width:min(var(--portal-modal-width,720px), 100%);
          max-height:88vh;
          overflow:auto;
          background:#FFFFFF;
          border-radius:20px;
          box-shadow:0 24px 70px rgba(15,23,42,.28);
        "
        onclick="event.stopPropagation()"
      >
      </div>

    </div>

    <script>
      async function openPortalModal(url, width) {
        const modal = document.getElementById("portal-modal");
        const content = document.getElementById("portal-modal-content");

        if (!modal || !content) return;

        content.style.setProperty(
  "--portal-modal-width",
  width || "720px"
);

        content.innerHTML = \`
          <div style="padding:32px; text-align:center;">
            Carregando...
          </div>
        \`;

        modal.style.display = "flex";
        document.body.style.overflow = "hidden";

        try {
  const response = await fetch(url);

  const responseText =
    await response.text();

  if (!response.ok) {

    if (responseText.trim()) {
      content.innerHTML =
        responseText;

      return;
    }

    throw new Error(
      "Não foi possível carregar os detalhes."
    );
  }

  content.innerHTML =
    responseText;

} catch (error) {

  content.innerHTML =
    '<div style="padding:32px;">' +
      '<h2 style="margin-bottom:12px;">Erro</h2>' +
      '<p style="color:#6B7280;">' +
        'Não foi possível carregar os detalhes.' +
      '</p>' +
    '</div>';
}
      }

      function closePortalModal(event) {
        if (event && event.target?.id !== "portal-modal") {
          return;
        }

        const modal = document.getElementById("portal-modal");
        const content = document.getElementById("portal-modal-content");

        if (!modal || !content) return;

        modal.style.display = "none";
        content.innerHTML = "";
        document.body.style.overflow = "";
      }

      window.selectTeamType = function(type) {

  const departmentCard = document.getElementById("department-card");
  const subteamCard = document.getElementById("subteam-card");
  const departmentContainer = document.getElementById("department-container");

  if (!departmentCard || !subteamCard || !departmentContainer) {
    return;
  }

  departmentCard.classList.toggle(
    "active",
    type === "department"
  );

  subteamCard.classList.toggle(
    "active",
    type === "subteam"
  );

  departmentContainer.style.display =
    type === "subteam"
      ? "block"
      : "none";

};

window.createTeam = async function () {

  const name = document
    .getElementById("team-name")
    ?.value
    ?.trim();

  const description = document
    .getElementById("team-description")
    ?.value
    ?.trim();

  const isSubteam = document
    .getElementById("subteam-card")
    ?.classList
    ?.contains("active");

  const group = isSubteam
    ? document.getElementById("team-group")?.value
    : null;

  if (!name) {
    alert("Informe o nome do time.");
    return;
  }

  if (isSubteam && !group) {
    alert("Selecione o departamento.");
    return;
  }

  try {

    const response = await fetch("/portal/teams", {

      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        name,
        description,
        group,
      }),

    });

    if (!response.ok) {
      throw new Error();
    }

    closePortalModal();

    window.location.reload();

  } catch {

    alert("Não foi possível criar o time.");

  }

};

window.addMember = async function(teamId, slackUserId) {

  try {

    const response = await fetch(
  \`/portal/teams/\${teamId}/members\`,
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      slackUserId,
    }),
  }
);

  if (!response.ok) {
    throw new Error();
  }

  closePortalModal();

window.location.reload();

} catch {

  alert("Não foi possível adicionar o membro.");

}

};

window.removeMember = async function(teamId, slackUserId) {

  if (!confirm("Remover este colaborador do time?")) {
    return;
  }

  try {

    const response = await fetch(
      \`/portal/teams/\${teamId}/members/\${slackUserId}\`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error();
    }

    closePortalModal();

window.location.reload();

  } catch {

    alert("Não foi possível remover o membro.");

  }

};

window.deleteTeam = async function(teamId) {

  if (!confirm("Deseja excluir este time?")) {
    return;
  }

  try {

    const response = await fetch(
      \`/portal/teams/\${teamId}\`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {

      const body = await response.json();

      alert(body.error);

      return;

    }

    closePortalModal();

    window.location.href = "/portal/teams";

  } catch {

    alert("Não foi possível excluir o time.");

  }

};

window.openDocumentation = function(processId) {

  openPortalModal(
    "/portal/processes/" + processId + "/documentation",
    "1200px"
  );

};
window.portalUpdateCompleteSelection = function () {

  const selected = Array.from(
    document.querySelectorAll(
      ".portal-task-complete-checkbox:checked"
    )
  );

  const completeButton = document.getElementById(
    "portal-complete-selected-button"
  );

  const rescheduleButton = document.getElementById(
    "portal-reschedule-selected-button"
  );

  const editButton = document.getElementById(
  "portal-edit-selected-button"
);

  const count = selected.length;

  if (completeButton) {

    completeButton.disabled = count === 0;

    completeButton.style.opacity =
      count === 0 ? ".5" : "1";

    completeButton.style.cursor =
      count === 0
        ? "not-allowed"
        : "pointer";

    completeButton.textContent =
      count === 0
        ? "✓ Concluir selecionadas"
        : count === 1
          ? "✓ Concluir 1 tarefa"
          : "✓ Concluir " + count + " tarefas";
  }

  if (rescheduleButton) {

  const canReschedule = count === 1;

  rescheduleButton.disabled =
    !canReschedule;

  rescheduleButton.style.opacity =
    canReschedule ? "1" : ".5";

  rescheduleButton.style.cursor =
    canReschedule
      ? "pointer"
      : "not-allowed";

  rescheduleButton.textContent =
    count > 1
      ? "📅 Reprogramar apenas 1 tarefa"
      : "📅 Reprogramar selecionada";
}
   if (editButton) {

  const canEdit = count === 1;

  editButton.disabled = !canEdit;

  editButton.style.opacity =
    canEdit ? "1" : ".5";

  editButton.style.cursor =
    canEdit
      ? "pointer"
      : "not-allowed";

  editButton.textContent =
    count > 1
      ? "✏️ Editar apenas 1 tarefa"
      : "✏️ Editar";
}   
};
window.portalOpenRescheduleSelected = async function () {

  const selected = Array.from(
    document.querySelectorAll(
      ".portal-task-complete-checkbox:checked"
    )
  );

  const taskIds = selected
    .map(function (checkbox) {
      return checkbox.value;
    })
    .filter(Boolean);

  if (taskIds.length !== 1) {
    return;
  }

  const taskId = taskIds[0];

  await openPortalModal(
    "/portal/tasks/reschedule/modal?taskId=" +
      encodeURIComponent(taskId),
    "520px"
  );
};
window.portalOpenEditSelected = async function () {

  const selected = Array.from(
    document.querySelectorAll(
      ".portal-task-complete-checkbox:checked"
    )
  );

  if (selected.length !== 1) {
    return;
  }

  const taskId = selected[0].value;

  if (!taskId) {
    return;
  }

  await openPortalModal(
    "/portal/tasks/" +
      encodeURIComponent(taskId) +
      "/edit/modal",
    "720px"
  );
};
window.portalConfirmRescheduleTasks = async function () {

  const taskId =
    document.getElementById(
      "portal-reschedule-task-id"
    )?.value;

  const newDateIso =
    document.getElementById(
      "portal-reschedule-date"
    )?.value;

  const newTime =
    document.getElementById(
      "portal-reschedule-time"
    )?.value || null;

  if (!taskId) {
    alert("Tarefa não encontrada.");
    return;
  }

  if (!newDateIso) {
    alert("Informe a nova data.");
    return;
  }

  const button =
    document.getElementById(
      "portal-reschedule-submit"
    );

  if (button) {
    button.disabled = true;
    button.style.opacity = ".6";
    button.style.cursor = "wait";
    button.textContent = "Reprogramando...";
  }

  try {

    const response = await fetch(
      "/portal/tasks/reschedule",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          taskId,
          newDateIso,
          newTime,
        }),
      }
    );

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
        "Não foi possível reprogramar."
      );
    }

    closePortalModal();

    window.location.reload();

  } catch (error) {

    alert(
      error?.message ||
      "Não foi possível reprogramar a tarefa."
    );

    if (button) {
      button.disabled = false;
      button.style.opacity = "1";
      button.style.cursor = "pointer";
      button.textContent = "📅 Reprogramar";
    }
  }
};

window.portalCompleteSelectedTasks = async function () {

  const selected = Array.from(
    document.querySelectorAll(
      ".portal-task-complete-checkbox:checked"
    )
  );

  const taskIds = selected
    .map(function (checkbox) {
      return checkbox.value;
    })
    .filter(Boolean);

  if (!taskIds.length) {
    return;
  }

  const message =
    taskIds.length === 1
      ? "Concluir esta tarefa?"
      : "Concluir as " +
        taskIds.length +
        " tarefas selecionadas?";

  if (!confirm(message)) {
    return;
  }

  const button = document.getElementById(
    "portal-complete-selected-button"
  );

  if (button) {
    button.disabled = true;
    button.style.opacity = ".6";
    button.style.cursor = "wait";
    button.textContent = "Concluindo...";
  }

  try {

    const response = await fetch(
      "/portal/tasks/complete",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          taskIds: taskIds,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.error ||
        "Não foi possível concluir."
      );
    }

    /*
     * Se algumas foram concluídas e outras
     * recusadas pelo backend, avisamos.
     */
    if (
      result.unauthorizedIds &&
      result.unauthorizedIds.length
    ) {
      alert(
        "Algumas tarefas não puderam ser concluídas."
      );
    }

    window.location.reload();

  } catch (error) {

    alert(
      error instanceof Error
        ? error.message
        : "Não foi possível concluir as tarefas."
    );

    portalUpdateCompleteSelection();
  }
};

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    const modal = document.getElementById("portal-modal");
    const content = document.getElementById("portal-modal-content");

    if (!modal || modal.style.display !== "flex") return;

    modal.style.display = "none";
    content.innerHTML = "";
    document.body.style.overflow = "";
  }
});

window.portalHandleTaskTypeChange = function() {

  const type =
    document.getElementById("portal-task-type")?.value;

  const normalFields =
    document.getElementById("portal-normal-task-fields");

  if (!normalFields) return;

  normalFields.style.display =
    type === "on_demand"
      ? "none"
      : "block";
};


window.portalHandleUrgencyChange = function() {

  const urgency =
    document.getElementById("portal-task-urgency")?.value;

  const turboFields =
    document.getElementById("portal-turbo-fields");

  if (!turboFields) return;

  turboFields.style.display =
    urgency === "turbo"
      ? "block"
      : "none";
};
window.portalNormalizeSearch = function(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
};


window.portalOpenResponsiblePicker = function() {

  const dropdown =
    document.getElementById(
      "portal-responsible-options"
    );

  if (!dropdown) return;

  dropdown.style.display = "block";

  window.portalFilterResponsible();
};


window.portalFilterResponsible = function() {
window.portalCloseUserDropdowns(
  "portal-responsible-options"
);

  const input =
    document.getElementById(
      "portal-task-responsible-search"
    );

  const empty =
    document.getElementById(
      "portal-responsible-empty"
    );

  if (!input) return;

  const search =
    window.portalNormalizeSearch(
      input.value
    );

  const options =
    document.querySelectorAll(
      ".portal-responsible-option"
    );

  let visible = 0;

  options.forEach(option => {

    const name =
      window.portalNormalizeSearch(
        option.dataset.userName
      );

    const show =
      !search ||
      name.includes(search);

    option.style.display =
      show ? "block" : "none";

    if (show) visible++;
  });

  if (empty) {
    empty.style.display =
      visible === 0
        ? "block"
        : "none";
  }
};


window.portalSelectResponsible = function(
  userId,
  userName
) {

  const hidden =
    document.getElementById(
      "portal-task-responsible"
    );

  const input =
    document.getElementById(
      "portal-task-responsible-search"
    );

  const dropdown =
    document.getElementById(
      "portal-responsible-options"
    );

  if (hidden) {
    hidden.value = userId;
  }

  if (input) {
    input.value = userName;
  }

  if (dropdown) {
    dropdown.style.display = "none";
  }
};


window.portalOpenCcPicker = function() {

  const dropdown =
    document.getElementById(
      "portal-cc-options"
    );

  if (!dropdown) return;

  dropdown.style.display = "block";

  window.portalFilterCarbonCopies();
};


window.portalFilterCarbonCopies = function() {
window.portalCloseUserDropdowns(
  "portal-cc-options"
);

  const input =
    document.getElementById(
      "portal-task-carbon-copies-search"
    );

  const empty =
    document.getElementById(
      "portal-cc-empty"
    );

  if (!input) return;

  const search =
    window.portalNormalizeSearch(
      input.value
    );

  const options =
    document.querySelectorAll(
      ".portal-cc-option"
    );

  let visible = 0;

  options.forEach(option => {

    const name =
      window.portalNormalizeSearch(
        option.dataset.userName
      );

    const show =
      !search ||
      name.includes(search);

    option.style.display =
      show ? "block" : "none";

    if (show) visible++;
  });

  if (empty) {
    empty.style.display =
      visible === 0
        ? "block"
        : "none";
  }
};


window.portalToggleCarbonCopy = function(
  userId,
  userName
) {

  const select =
    document.getElementById(
      "portal-task-carbon-copies"
    );

  if (!select) return;

  const option =
    Array.from(select.options)
      .find(option =>
        option.value === userId
      );

  if (!option) return;

  option.selected = !option.selected;

  window.portalRenderCarbonCopies();

  const search =
    document.getElementById(
      "portal-task-carbon-copies-search"
    );

  const dropdown =
    document.getElementById(
      "portal-cc-options"
    );

  if (search) {
    search.value = "";
  }

  if (dropdown) {
    dropdown.style.display = "none";
  }
};

window.portalCloseUserDropdowns = function(exceptId) {

  const dropdowns = [
    "portal-responsible-options",
    "portal-cc-options",
  ];

  dropdowns.forEach(function(id) {

    if (id === exceptId) {
      return;
    }

    const dropdown =
      document.getElementById(id);

    if (dropdown) {
      dropdown.style.display = "none";
    }

  });

};
window.portalRemoveCarbonCopy = function(
  userId
) {

  const select =
    document.getElementById(
      "portal-task-carbon-copies"
    );

  if (!select) return;

  const option =
    Array.from(select.options)
      .find(option =>
        option.value === userId
      );

  if (option) {
    option.selected = false;
  }

  window.portalRenderCarbonCopies();
};


window.portalRenderCarbonCopies = function() {

  const select =
    document.getElementById(
      "portal-task-carbon-copies"
    );

  const container =
    document.getElementById(
      "portal-cc-selected"
    );

  if (!select || !container) return;

  const selected =
    Array.from(select.options)
      .filter(option =>
        option.selected
      );

  container.innerHTML =
    selected
      .map(option => \`
        <span
          style="
            display:inline-flex;
            align-items:center;
            gap:6px;
            padding:6px 9px;
            border-radius:999px;
            background:#ECFDF5;
            color:#166534;
            font-size:13px;
            font-weight:600;
          "
        >
          \${option.text}

          <button
            type="button"
            onclick="portalRemoveCarbonCopy('\${option.value}')"
            style="
              border:none;
              background:none;
              padding:0;
              color:#166534;
              cursor:pointer;
              font-size:15px;
              line-height:1;
            "
          >
            ×
          </button>
        </span>
      \`)
      .join("");
};
document.addEventListener("click", function(event) {

  const responsiblePicker =
    document.getElementById(
      "portal-responsible-picker"
    );

  const responsibleDropdown =
    document.getElementById(
      "portal-responsible-options"
    );

  if (
    responsiblePicker &&
    responsibleDropdown &&
    !responsiblePicker.contains(event.target)
  ) {
    responsibleDropdown.style.display =
      "none";
  }


  const ccPicker =
    document.getElementById(
      "portal-cc-picker"
    );

  const ccDropdown =
    document.getElementById(
      "portal-cc-options"
    );

  if (
    ccPicker &&
    ccDropdown &&
    !ccPicker.contains(event.target)
  ) {
    ccDropdown.style.display =
      "none";
  }

});
document.addEventListener(
  "click",
  function(event) {

    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const responsiblePicker =
      document.getElementById(
        "portal-responsible-picker"
      );

    const responsibleDropdown =
      document.getElementById(
        "portal-responsible-options"
      );

    const ccPicker =
      document.getElementById(
        "portal-cc-picker"
      );

    const ccDropdown =
      document.getElementById(
        "portal-cc-options"
      );

    if (
      responsibleDropdown &&
      responsiblePicker &&
      !responsiblePicker.contains(target)
    ) {
      responsibleDropdown.style.display = "none";
    }

    if (
      ccDropdown &&
      ccPicker &&
      !ccPicker.contains(target)
    ) {
      ccDropdown.style.display = "none";
    }

  },
  true
);
window.portalCreateTask = async function () {

  const getValue = (id) =>
    document.getElementById(id)?.value ?? "";

  const getCheckedValues = (id) => {
    const el = document.getElementById(id);

    if (!el) return [];

    return Array.from(
      el.querySelectorAll(
        'input[type="checkbox"]:checked'
      )
    ).map(input => input.value);
  };

  const title =
    getValue("portal-task-title").trim();

  const description =
    getValue("portal-task-description").trim();

  const processId =
    getValue("portal-task-process") || null;

  const responsible =
    getValue("portal-task-responsible");

  const taskType =
    getValue("portal-task-type") || "normal";

  const term =
    taskType === "on_demand"
      ? null
      : getValue("portal-task-term") || null;

  const deadlineTime =
    taskType === "on_demand"
      ? null
      : getValue("portal-task-deadline-time") || null;

  const dependsOnId =
    taskType === "on_demand"
      ? null
      : getValue("portal-task-depends-on") || null;

  const recurrence =
    taskType === "on_demand"
      ? null
      : getValue("portal-task-recurrence") || null;

  const urgency =
    taskType === "on_demand"
      ? "light"
      : getValue("portal-task-urgency") || "light";

  const reminderMode =
    taskType === "on_demand"
      ? "until"
      : getValue("portal-task-reminder-mode") || "until";

  const turboPreviousDayEl =
    document.getElementById(
      "portal-task-turbo-previous-day"
    );

  const turboPreviousDay =
    taskType !== "on_demand" &&
    urgency === "turbo"
      ? Boolean(turboPreviousDayEl?.checked)
      : false;

  const turboStartTime =
    taskType !== "on_demand" &&
    urgency === "turbo"
      ? getValue("portal-task-turbo-start-time") || null
      : null;

  const carbonCopies =
    getCheckedValues(
      "portal-task-carbon-copies"
    );

  const calendarPrivateEl =
    document.getElementById(
      "portal-task-calendar-private"
    );

  const calendarPrivate =
    Boolean(calendarPrivateEl?.checked);

  if (!title) {
    alert("Informe o título da tarefa.");
    return;
  }

  if (!responsible) {
    alert("Selecione o responsável.");
    return;
  }

  if (
    taskType !== "on_demand" &&
    !term
  ) {
    alert("Informe o prazo da tarefa.");
    return;
  }

  const button =
    document.getElementById(
      "portal-create-task-button"
    );

  const originalText =
    button?.innerHTML;

  if (button) {
    button.disabled = true;
    button.innerHTML = "Criando...";
  }

  try {

    const response = await fetch(
      "/portal/tasks/create",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          title,
          description:
            description || null,
          processId,
          responsible,
          taskType,
          term,
          deadlineTime,
          dependsOnId,
          recurrence,
          urgency,
          reminderMode,
          turboPreviousDay,
          turboStartTime,
          carbonCopies,
          calendarPrivate,
        }),
      }
    );

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result?.error ||
        "Não foi possível criar a tarefa."
      );
    }

    closePortalModal();

    window.location.reload();

  } catch (error) {

    alert(
      error instanceof Error
        ? error.message
        : "Não foi possível criar a tarefa."
    );

    if (button) {
      button.disabled = false;
      button.innerHTML =
        originalText || "➕ Criar tarefa";
    }
  }
};
window.portalUpdateTask = async function (taskId) {

  if (!taskId) {
    return;
  }

  const getValue = (id) =>
    document.getElementById(id)?.value ?? "";

  const getCheckedValues = (id) => {
    const el = document.getElementById(id);

    if (!el) return [];

    return Array.from(
      el.querySelectorAll(
        'input[type="checkbox"]:checked'
      )
    ).map(input => input.value);
  };

  const title =
    getValue("portal-task-title").trim();

  const description =
    getValue("portal-task-description").trim();

  const processId =
    getValue("portal-task-process") || null;

  const responsible =
    getValue("portal-task-responsible");

  const taskType =
    getValue("portal-task-type") || "normal";

  const term =
    taskType === "on_demand"
      ? null
      : getValue("portal-task-term") || null;

  const deadlineTime =
    taskType === "on_demand"
      ? null
      : getValue("portal-task-deadline-time") || null;

  const recurrence =
    taskType === "on_demand"
      ? null
      : getValue("portal-task-recurrence") || null;

  const urgency =
    taskType === "on_demand"
      ? "light"
      : getValue("portal-task-urgency") || "light";

  const reminderMode =
    taskType === "on_demand"
      ? "until"
      : getValue("portal-task-reminder-mode") || "until";

  const turboPreviousDayEl =
    document.getElementById(
      "portal-task-turbo-previous-day"
    );

  const turboPreviousDay =
    taskType !== "on_demand" &&
    urgency === "turbo"
      ? Boolean(turboPreviousDayEl?.checked)
      : false;

  const turboStartTime =
    taskType !== "on_demand" &&
    urgency === "turbo"
      ? getValue("portal-task-turbo-start-time") || null
      : null;

  const carbonCopies =
    getCheckedValues(
      "portal-task-carbon-copies"
    );

  const calendarPrivateEl =
    document.getElementById(
      "portal-task-calendar-private"
    );

  const calendarPrivate =
    Boolean(calendarPrivateEl?.checked);

  if (!title) {
    alert("Informe o título da tarefa.");
    return;
  }

  if (!responsible) {
    alert("Selecione o responsável.");
    return;
  }

  if (
    taskType !== "on_demand" &&
    !term
  ) {
    alert("Informe o prazo da tarefa.");
    return;
  }

  const button =
    document.getElementById(
      "portal-create-task-button"
    );

  const originalText =
    button?.innerHTML;

  if (button) {
    button.disabled = true;
    button.innerHTML = "Salvando...";
  }

  try {

    const response = await fetch(
      "/portal/tasks/" +
        encodeURIComponent(taskId) +
        "/update",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          title,
          description:
            description || null,
          processId,
          responsible,
          taskType,
          term,
          deadlineTime,
          recurrence,
          urgency,
          reminderMode,
          turboPreviousDay,
          turboStartTime,
          carbonCopies,
          calendarPrivate,
        }),
      }
    );

    const result =
      await response.json();

    if (!response.ok) {
      throw new Error(
        result?.error ||
        "Não foi possível editar a tarefa."
      );
    }

    closePortalModal();

    window.location.reload();

  } catch (error) {

    alert(
      error instanceof Error
        ? error.message
        : "Não foi possível editar a tarefa."
    );

    if (button) {
      button.disabled = false;
      button.innerHTML =
        originalText || "Salvar alterações";
    }
  }
};
</script>
  `;
}