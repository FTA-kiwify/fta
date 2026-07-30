type TreeItemProps = {
  title: string;
  body: string;
  open?: boolean;
};

export function treeItem({
  title,
  body,
  open = false,
}: TreeItemProps) {

  return `

    <details ${open ? "open" : ""}>

      <summary
        style="
          cursor:pointer;
          padding:8px 0;
          font-weight:600;
          user-select:none;
        "
      >

        ${title}

      </summary>

      <div
        style="
          margin-left:24px;
          margin-top:6px;
        "
      >

        ${body}

      </div>

    </details>

  `;

}