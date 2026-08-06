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
        margin-bottom:20px;
        border:1px solid #E5E7EB;
        border-radius:14px;
        overflow:hidden;
        background:white;
      "
    >

      <div
        onclick="

          const body=document.getElementById('${id}');
          const arrow=document.getElementById('${id}-arrow');

          const open=body.style.display==='block';

          body.style.display=open ? 'none' : 'block';

          arrow.style.transform=open
            ? 'rotate(0deg)'
            : 'rotate(90deg)';

        "
        style="
          display:flex;
          justify-content:space-between;
          align-items:center;
          cursor:pointer;
          padding:18px 22px;
          transition:.15s;
          user-select:none;
        "
        onmouseover="
          this.style.background='#F9FAFB'
        "
        onmouseout="
          this.style.background='white'
        "
      >

        <div
          style="
            display:flex;
            align-items:center;
            gap:14px;
          "
        >

          <div
            id="${id}-arrow"
            style="
              width:18px;
              display:flex;
              justify-content:center;
              color:#9CA3AF;
              transition:.18s;
            "
          >
            ▶
          </div>

          <div>

            <div
              style="
                font-size:16px;
                font-weight:600;
                color:#111827;
              "
            >
              ${title}
            </div>

            <div
              style="
                margin-top:3px;
                font-size:13px;
                color:#6B7280;
              "
            >
              ${count} processo${count !== 1 ? "s" : ""}
            </div>

          </div>

        </div>

      </div>

      <div
        id="${id}"
        class="portal-accordion-body"
        style="
          display:none;
          border-top:1px solid #E5E7EB;
          padding:0 22px 22px;
          animation:fadeIn .18s ease;
        "
      >

        ${body}

      </div>

    </div>

  `;

}