export function portalCss() {
  return `
    *{
      margin:0;
      padding:0;
      box-sizing:border-box;
    }

    :root{
      --bg:#F6F8FB;
      --sidebar:#0F7A55;
      --sidebar-hover:#169866;
      --card:#FFFFFF;
      --text:#1F2937;
      --muted:#6B7280;
      --primary:#27C27A;
      --border:#E5E7EB;
    }

    body{
      font-family:Inter,system-ui,-apple-system,sans-serif;
      background:var(--bg);
      color:var(--text);
    }

    a{
      color:inherit;
      text-decoration:none;
    }

    .layout{
      display:flex;
      min-height:100vh;
    }

    .content{
      flex:1;
      padding:32px;
    }

    .card{
      background:var(--card);
      border-radius:18px;
      padding:28px;
      box-shadow:
        0 10px 30px rgba(15,23,42,.05),
        0 2px 8px rgba(15,23,42,.04);
    }

    h1{
      font-size:36px;
      margin-bottom:12px;
      font-weight:700;
    }

    h2{
      font-size:22px;
      margin-bottom:20px;
    }

    p{
      color:var(--muted);
      font-size:18px;
      line-height:1.6;
    }

    .sidebar-link{
      display:flex;
      align-items:center;
      gap:12px;
      padding:12px 14px;
      border-radius:12px;
      color:white;
      transition:.2s;
      font-weight:500;
    }

    .sidebar-link:hover{
      background:var(--sidebar-hover);
    }

    .sidebar-link.active{
      background:rgba(255,255,255,.15);
    }

    .dashboard-grid{
  display:grid;
  grid-template-columns:repeat(auto-fit,minmax(320px,1fr));
  gap:22px;
  margin-top:28px;
  align-items:start;
}

    .stat-card{
      background:white;
      border-radius:18px;
      padding:22px;
      display:flex;
      justify-content:space-between;
      align-items:center;
      box-shadow:0 8px 24px rgba(15,23,42,.05);
      cursor:default;
      user-select:none;
    }

    .stat-title{
      color:#64748B;
      font-size:14px;
      margin-bottom:10px;
    }

    .stat-value{
      font-size:34px;
      font-weight:700;
      color:#111827;
    }

    .stat-subtitle{
      margin-top:8px;
      color:#94A3B8;
      font-size:13px;
    }

    .stat-icon{
      width:54px;
      height:54px;
      border-radius:16px;
      display:flex;
      justify-content:center;
      align-items:center;
      font-size:24px;
      color:white;
      opacity:.9;
      flex-shrink:0;
    }

    .dashboard-section{
      min-height:260px;
    }

    .dashboard-section-title{
      font-size:22px;
      margin-bottom:18px;
    }

    .dashboard-table{
      width:100%;
      border-collapse:collapse;
    }

    .dashboard-table tr{
      border-bottom:1px solid #ECECEC;
    }

    .dashboard-table td{
      padding:14px 0;
      font-size:15px;
    }

    .dashboard-table td:last-child{
      text-align:right;
      color:#64748B;
      font-weight:600;
    }

    .collaborator-list{
      margin-top:26px;
      display:flex;
      flex-direction:column;
      gap:18px;
    }

    .collaborator-card{
      background:white;
      border-radius:18px;
      padding:24px;
      display:flex;
      align-items:center;
      gap:24px;
      box-shadow:0 8px 24px rgba(15,23,42,.05);
    }

    .collaborator-avatar{
      width:72px;
      height:72px;
      border-radius:50%;
      background:#27C27A;
      color:white;
      display:flex;
      justify-content:center;
      align-items:center;
      font-size:30px;
      font-weight:bold;
      flex-shrink:0;
    }

    .collaborator-info{
      flex:1;
    }

    .collaborator-info h3{
      font-size:22px;
      margin-bottom:6px;
    }

    .collaborator-info p{
      font-size:15px;
      margin-bottom:12px;
    }

    .collaborator-stats{
      display:flex;
      gap:20px;
      color:#64748B;
      font-size:14px;
    }

    .button-primary{
      background:#27C27A;
      color:white;
      padding:12px 20px;
      border-radius:12px;
      font-weight:600;
      transition:.2s;
    }

    .button-primary:hover{
      background:#20AF6F;
    }

    @keyframes fadeIn{

  from{
    opacity:0;
  }

  to{
    opacity:1;
  }

}
/* ---------- FORMULÁRIOS ---------- */

.portal-label{
  display:block;
  margin-bottom:8px;
  font-size:14px;
  font-weight:600;
  color:#374151;
}

.portal-input,
.portal-select,
.portal-textarea{
  width:100%;
  padding:12px 14px;
  border:1px solid var(--border);
  border-radius:12px;
  font-size:15px;
  background:white;
  transition:.15s;
}

.portal-input:focus,
.portal-select:focus,
.portal-textarea:focus{
  outline:none;
  border-color:var(--primary);
  box-shadow:0 0 0 4px rgba(39,194,122,.15);
}

.portal-textarea{
  resize:vertical;
  min-height:90px;
}

.portal-form-group{
  margin-bottom:22px;
}

/* ---------- BOTÕES ---------- */

.btn-primary{
  background:var(--primary);
  color:white;
  border:none;
  border-radius:12px;
  padding:12px 18px;
  font-size:15px;
  font-weight:600;
  cursor:pointer;
  transition:.15s;
}

.btn-primary:hover{
  transform:translateY(-1px);
  background:#20AF6F;
}

.btn-secondary{
  background:white;
  border:1px solid var(--border);
  color:#374151;
  border-radius:12px;
  padding:12px 18px;
  font-size:15px;
  font-weight:600;
  cursor:pointer;
  transition:.15s;
}

.btn-secondary:hover{
  background:#F9FAFB;
}

/* ---------- MODAL ---------- */

.portal-modal-header{
  display:flex;
  justify-content:space-between;
  align-items:center;
  margin-bottom:28px;
}

.portal-modal-footer{
  display:flex;
  justify-content:flex-end;
  gap:12px;
  margin-top:30px;
}

/* ---------- OPÇÕES ---------- */

.portal-options{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:14px;
}

.portal-option{
  border:2px solid var(--border);
  border-radius:14px;
  padding:18px;
  cursor:pointer;
  transition:.15s;
}

.portal-option:hover{
  border-color:var(--primary);
}

.portal-option.active{
  border-color:var(--primary);
  background:#ECFDF5;
}

.portal-option-title{
  font-weight:700;
  margin-bottom:6px;
}

.portal-option-subtitle{
  color:#6B7280;
  font-size:14px;
}
  `;
}