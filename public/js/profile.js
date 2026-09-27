import { api, nav } from "./app.js";

nav();

const page = document.getElementById("page");
const { user } = await api("/api/auth/me");

if (!user) {
  page.innerHTML = '<p>Please <a href="/login.html">log in</a>.</p>';
} else {
  const hasAddress = Boolean(user.address);
  page.innerHTML = `
    <form id="f">
      <input name="name" value="${user.name}" placeholder="Name" required />
      <input value="${user.email}" disabled />
      <input name="phone" value="${user.phone || ""}" placeholder="Phone" />
      <input name="hostel" value="${user.hostel || ""}" placeholder="Hostel / room" />
      <button type="button" class="btn" id="add-addr">${hasAddress ? "Edit address" : "Add an address"}</button>
      <textarea name="address" id="address" placeholder="Hostel block, room, landmark" ${hasAddress ? "" : "hidden"}>${user.address || ""}</textarea>
      <button class="btn">Save</button>
    </form>
    <p><button id="out" type="button">Log out</button></p>
    <p id="msg"></p>`;

  document.getElementById("add-addr").onclick = () => {
    const box = document.getElementById("address");
    box.hidden = false;
    box.focus();
  };

  document.getElementById("f").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await api("/api/profile", {
      method: "PUT",
      body: {
        name: fd.get("name"),
        phone: fd.get("phone"),
        hostel: fd.get("hostel"),
        address: fd.get("address"),
      },
    });
    document.getElementById("msg").textContent = "Saved.";
  };
  document.getElementById("out").onclick = async () => {
    await api("/api/auth/logout", { method: "POST", body: {} });
    location.href = "/";
  };
}
