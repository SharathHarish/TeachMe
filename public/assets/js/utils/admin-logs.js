window.onload = () => {
    const tableBody = document.querySelector("#logsTable tbody");
    const logs = Logger.getLogs();

    logs.forEach(log => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${log.timestamp}</td>
            <td>${log.action}</td>
            <td>${JSON.stringify(log.details)}</td>
        `;

        tableBody.appendChild(row);
    });

    document.getElementById("clearLogs").addEventListener("click", () => {
        Logger.clear();
        location.reload();
    });
};
