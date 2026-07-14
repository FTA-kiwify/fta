type AccordionProps = {
    id: string;
    title: string;
    count: number;
    body: string;
};

export function accordion({
    id,
    title,
    count,
    body,
}: AccordionProps) {

    return `
    <div
      style="
        margin-bottom:18px;
      "
    >

      <div
        onclick="
          document.querySelectorAll('.portal-accordion-body').forEach(el=>{
            if(el.id!=='${id}'){
              el.style.display='none';
            }
          });

          document.querySelectorAll('.portal-accordion-arrow').forEach(el=>{
            if(el.id!=='${id}-arrow'){
              el.innerHTML='▸';
            }
          });

          const body=document.getElementById('${id}');
          const arrow=document.getElementById('${id}-arrow');

          const open=body.style.display==='block';

          body.style.display=open?'none':'block';
          arrow.innerHTML=open?'▸':'▾';
        "
        style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          cursor:pointer;
          padding:14px 0;
          border-bottom:1px solid #E5E7EB;
          font-weight:600;
          user-select:none;
        "
      >

        <span
          style="
            display:flex;
            align-items:center;
            gap:10px;
          "
        >

          <span
            id="${id}-arrow"
            class="portal-accordion-arrow"
            style="
              width:14px;
              color:#6B7280;
            "
          >
            ▸
          </span>

          ${title}

        </span>

        <span
          style="
            color:#6B7280;
            font-weight:500;
          "
        >
          ${count}
        </span>

      </div>

      <div
        id="${id}"
        class="portal-accordion-body"
        style="
          display:none;
          animation:fadeIn .18s ease;
        "
      >

        ${body}

      </div>

    </div>
  `;

}