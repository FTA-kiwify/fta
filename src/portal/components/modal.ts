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

if (window.portalRenderCarbonCopies) {
  window.portalRenderCarbonCopies();
}

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

    const cancelButton =
    document.getElementById(
      "portal-cancel-selected-button"
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
        if (cancelButton) {

    const canCancel =
      count > 0;

    cancelButton.disabled =
      !canCancel;

    cancelButton.style.opacity =
      canCancel ? "1" : ".5";

    cancelButton.style.cursor =
      canCancel
        ? "pointer"
        : "not-allowed";

    cancelButton.textContent =
      count === 0
        ? "✕ Cancelar selecionadas"
        : count === 1
          ? "✕ Cancelar 1 tarefa"
          : "✕ Cancelar " +
            count +
            " tarefas";
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
window.portalCancelSelectedTasks =
  async function () {

    const selected =
      Array.from(
        document.querySelectorAll(
          ".portal-task-complete-checkbox:checked"
        )
      );

    const taskIds =
      selected
        .map(checkbox =>
          checkbox.value
        )
        .filter(Boolean);

    if (!taskIds.length) {
      return;
    }

    const message =
      taskIds.length === 1
        ? "Cancelar esta tarefa?"
        : "Cancelar as " +
          taskIds.length +
          " tarefas selecionadas?";

    if (!confirm(message)) {
      return;
    }

    const button =
      document.getElementById(
        "portal-cancel-selected-button"
      );

    const originalText =
      button?.textContent;

    if (button) {
      button.disabled = true;
      button.style.opacity = ".6";
      button.style.cursor = "wait";
      button.textContent =
        "Cancelando...";
    }

    try {

      const response =
        await fetch(
          "/portal/tasks/cancel",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                taskIds,
              }),
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
          "Não foi possível cancelar."
        );
      }

      window.location.reload();

    } catch (error) {

      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível cancelar."
      );

      if (button) {
        button.disabled = false;
        button.style.opacity = "1";
        button.style.cursor = "pointer";
        button.textContent =
          originalText ||
          "✕ Cancelar selecionadas";
      }
    }
  };

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

window.portalOpenBackupResponsiblePicker = function() {

  const dropdown =
    document.getElementById(
      "portal-backup-responsible-options"
    );

  if (!dropdown) return;

  dropdown.style.display = "block";

  window.portalFilterBackupResponsible();
};


window.portalFilterBackupResponsible = function() {

  window.portalCloseUserDropdowns(
    "portal-backup-responsible-options"
  );

  const input =
    document.getElementById(
      "portal-task-backup-responsible-search"
    );

  const empty =
    document.getElementById(
      "portal-backup-responsible-empty"
    );

  if (!input) return;

  const search =
    window.portalNormalizeSearch(
      input.value
    );

  const options =
    document.querySelectorAll(
      ".portal-backup-responsible-option"
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


window.portalSelectBackupResponsible = function(
  userId,
  userName
) {

  const hidden =
    document.getElementById(
      "portal-task-backup-responsible"
    );

  const input =
    document.getElementById(
      "portal-task-backup-responsible-search"
    );

  const dropdown =
    document.getElementById(
      "portal-backup-responsible-options"
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
    const backupResponsiblePicker =
      document.getElementById(
        "portal-backup-responsible-picker"
      );

    const backupResponsibleDropdown =
      document.getElementById(
        "portal-backup-responsible-options"
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
      backupResponsibleDropdown &&
      backupResponsiblePicker &&
      !backupResponsiblePicker.contains(target)
    ) {
      backupResponsibleDropdown.style.display = "none";
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

 const backupResponsible =
    getValue("portal-task-backup-responsible") || null;

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

  const carbonCopies = Array.from(
  document.getElementById(
    "portal-task-carbon-copies"
  )?.selectedOptions ?? []
).map(option => option.value);

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
    backupResponsible &&
    backupResponsible === responsible
  ) {
    alert(
      "O backup deve ser diferente do responsável."
    );
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
          backupResponsible,
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

 const backupResponsible =
    getValue("portal-task-backup-responsible") || null;

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

  const carbonCopies = Array.from(
  document.getElementById(
    "portal-task-carbon-copies"
  )?.selectedOptions ?? []
).map(option => option.value);

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
    backupResponsible &&
    backupResponsible === responsible
  ) {
    alert(
      "O backup deve ser diferente do responsável."
    );
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
          backupResponsible,
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

// ==========================================
// COLABORADOR — BACKUP
// ==========================================

window.portalStartCollaboratorBackup = async function(slackUserId) {
  const confirmed = confirm(
  "Tem certeza que deseja iniciar o backup deste colaborador?\\n\\n" +
  "Todas as tarefas elegíveis que possuem um responsável backup cadastrado serão redistribuídas para seus respectivos backups."
);

  if (!confirmed) return;

  try {
    const response = await fetch(
  "/portal/collaborators/" +
    encodeURIComponent(slackUserId) +
    "/backup/start",
  {
    method: "POST",
  }
);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result?.error ||
        "Não foi possível iniciar o backup."
      );
    }

    alert(
  "Backup iniciado.\\n\\n" +
  "Tarefas elegíveis: " + (result.eligible ?? 0) + "\\n" +
  "Redistribuídas: " + (result.transferred ?? 0) + "\\n" +
  "Falhas: " + (result.failed ?? 0)
);

    window.location.reload();

  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "Não foi possível iniciar o backup."
    );
  }
};


window.portalStopCollaboratorBackup = async function(slackUserId) {
  const confirmed = confirm(
  "Tem certeza que deseja encerrar o backup deste colaborador?\\n\\n" +
  "As tarefas redistribuídas temporariamente voltarão aos seus responsáveis originais."
);

  if (!confirmed) return;

  try {
    const response = await fetch(
  "/portal/collaborators/" +
    encodeURIComponent(slackUserId) +
    "/backup/stop",
  {
    method: "POST",
  }
);

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result?.error ||
        "Não foi possível encerrar o backup."
      );
    }

    if ((result.failed ?? 0) > 0) {
  alert(
    "O retorno do backup não foi concluído completamente.\\n\\n" +
    "Encontradas: " + (result.found ?? 0) + "\\n" +
    "Restauradas: " + (result.restored ?? 0) + "\\n" +
    "Falhas: " + (result.failed ?? 0) + "\\n\\n" +
    "O colaborador continuará com status de backup até que todas as tarefas sejam restauradas."
  );
} else {
  alert(
    "Backup encerrado.\\n\\n" +
    "Tarefas restauradas: " + (result.restored ?? 0)
  );
}

    window.location.reload();

  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "Não foi possível encerrar o backup."
    );
  }
};

window.portalDeactivateCollaborator = async function(slackUserId) {
  try {
    const previewResponse = await fetch(
      "/portal/collaborators/" +
        encodeURIComponent(slackUserId) +
        "/deactivation-preview"
    );

    const preview =
      await previewResponse.json();

    if (!previewResponse.ok) {
      throw new Error(
        preview?.error ||
        "Não foi possível preparar o desligamento."
      );
    }

    const optionsResponse = await fetch(
      "/portal/collaborators/" +
        encodeURIComponent(slackUserId) +
        "/replacement-options"
    );

    const optionsResult =
      await optionsResponse.json();

    if (!optionsResponse.ok) {
      throw new Error(
        optionsResult?.error ||
        "Não foi possível carregar os backups disponíveis."
      );
    }

    window.portalOpenDeactivationModal(
      slackUserId,
      preview,
      optionsResult.options ?? []
    );

  } catch (error) {
    alert(
      error instanceof Error
        ? error.message
        : "Não foi possível preparar o desligamento."
    );
  }
};
window.portalOpenDeactivationModal = function(
  slackUserId,
  preview,
  options
) {
  const modal =
    document.getElementById(
      "portal-modal"
    );

  const content =
    document.getElementById(
      "portal-modal-content"
    );

  if (!modal || !content) {
    return;
  }

  const tasks =
    preview.tasks ?? [];

  const escapeHtml = function(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const optionHtml =
    options
      .map(function(option) {
        return (
          '<option value="' +
          escapeHtml(option.id) +
          '">' +
          escapeHtml(option.name) +
          '</option>'
        );
      })
      .join("");

  const taskHtml =
    tasks.length
      ? tasks
          .map(function(task) {

            const backupField =
              task.needsBackup
                ? (
                    '<select ' +
                      'class="portal-deactivation-backup" ' +
                      'data-task-id="' +
                      escapeHtml(task.id) +
                      '" ' +
                      'style="' +
                        'width:100%;' +
                        'padding:10px 12px;' +
                        'border:1px solid #D1D5DB;' +
                        'border-radius:10px;' +
                        'background:#FFFFFF;' +
                      '"' +
                    '>' +
                      '<option value="">' +
                        'Selecione o backup...' +
                      '</option>' +
                      optionHtml +
                    '</select>'
                  )
                : (
                    '<div ' +
                      'style="' +
                        'padding:10px 12px;' +
                        'border-radius:10px;' +
                        'background:#ECFDF5;' +
                        'color:#166534;' +
                        'font-weight:600;' +
                      '"' +
                    '>' +
                      '✓ ' +
                      escapeHtml(
                        task.backupResponsibleName ||
                        task.backupResponsible
                      ) +
                    '</div>'
                  );

            return (
              '<div ' +
                'style="' +
                  'padding:16px 0;' +
                  'border-bottom:1px solid #E5E7EB;' +
                '"' +
              '>' +

                '<div ' +
                  'style="' +
                    'font-weight:700;' +
                    'margin-bottom:8px;' +
                    'color:#111827;' +
                  '"' +
                '>' +
                  escapeHtml(task.title) +
                '</div>' +

                '<div ' +
                  'style="' +
                    'font-size:13px;' +
                    'color:#6B7280;' +
                    'margin-bottom:8px;' +
                  '"' +
                '>' +
                  (
                    task.calendarPrivate
                      ? "🔒 Tarefa privada"
                      : "📋 Tarefa"
                  ) +
                '</div>' +

                backupField +

              '</div>'
            );
          })
          .join("")
      : (
          '<div ' +
            'style="' +
              'padding:18px 0;' +
              'color:#6B7280;' +
            '"' +
          '>' +
            'Este colaborador não possui tarefas pendentes.' +
          '</div>'
        );

  content.innerHTML =
    '<div style="padding:28px;">' +

      '<h2 ' +
        'style="' +
          'margin:0 0 8px;' +
          'font-size:22px;' +
        '"' +
      '>' +
        '🚫 Desligar colaborador' +
      '</h2>' +

      '<p ' +
        'style="' +
          'margin:0 0 20px;' +
          'color:#6B7280;' +
          'line-height:1.5;' +
        '"' +
      '>' +
        'Confira os backups das atividades antes de continuar.' +
      '</p>' +

      '<div>' +
        taskHtml +
      '</div>' +

      '<div ' +
        'style="' +
          'display:flex;' +
          'justify-content:flex-end;' +
          'gap:10px;' +
          'margin-top:24px;' +
        '"' +
      '>' +

        '<button ' +
          'type="button" ' +
          'class="btn btn-secondary" ' +
          'onclick="closePortalModal()"' +
        '>' +
          'Cancelar' +
        '</button>' +

        '<button ' +
          'type="button" ' +
          'class="btn btn-danger" ' +
          'onclick="portalContinueCollaboratorDeactivation(' +
            "'" +
            escapeHtml(slackUserId) +
            "'" +
          ')"' +
        '>' +
          'Continuar' +
        '</button>' +

      '</div>' +

    '</div>';

  modal.style.display = "flex";
  document.body.style.overflow = "hidden";
};

window.portalContinueCollaboratorDeactivation =
  function(slackUserId) {

    const selects =
      Array.from(
        document.querySelectorAll(
          ".portal-deactivation-backup"
        )
      );

    const missing =
      selects.filter(
        select =>
          !String(
            select.value || ""
          ).trim()
      );

    if (missing.length) {
      alert(
        "Defina o backup de todas as atividades antes de continuar."
      );

      missing[0]?.focus();
      return;
    }

    const taskBackups =
      selects.map(select => ({
        taskId:
          select.dataset.taskId,
        backupSlackId:
          select.value,
      }));

    window.portalConfirmCollaboratorDeactivation(
      slackUserId,
      taskBackups
    );
  };
window.portalConfirmCollaboratorDeactivation =
  async function(slackUserId, taskBackups) {

    const confirmed = confirm(
      "Tem certeza que deseja desligar este colaborador?\\n\\n" +
      "Todas as atividades serão redistribuídas para os backups definidos. " +
      "Se o colaborador também for o delegador da atividade, o backup passará a ser o novo delegador.\\n\\n" +
      "Esta redistribuição é definitiva."
    );

    if (!confirmed) {
      return;
    }

    try {

      const response = await fetch(
        "/portal/collaborators/" +
          encodeURIComponent(slackUserId) +
          "/deactivate",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            taskBackups,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
          "Não foi possível desligar o colaborador."
        );
      }

      /*
       * Segurança:
       * o service não marca inactive se alguma
       * atividade continuar com o colaborador.
       */
      if (!result.deactivated) {

        alert(
          "O desligamento não foi concluído.\\n\\n" +
          "Tarefas encontradas: " +
          (result.total ?? 0) +
          "\\nTransferidas: " +
          (result.transferred ?? 0) +
          "\\nFalhas: " +
          (result.failed ?? 0) +
          "\\nAinda atribuídas ao colaborador: " +
          (result.remaining ?? 0) +
          "\\n\\nO colaborador NÃO foi marcado como desligado."
        );

        window.location.reload();
        return;
      }

      alert(
        "Colaborador desligado com sucesso.\\n\\n" +
        "Tarefas redistribuídas: " +
        (result.transferred ?? 0)
      );

      window.location.reload();

    } catch (error) {

      alert(
        error instanceof Error
          ? error.message
          : "Não foi possível desligar o colaborador."
      );
    }
  };
</script>
  `;
}