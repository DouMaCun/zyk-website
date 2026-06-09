const merchantForm = document.querySelector("#merchantForm");
const formMessage = document.querySelector("#formMessage");

if (merchantForm && formMessage) {
  merchantForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(merchantForm);
    const application = Object.fromEntries(formData.entries());
    const applications = JSON.parse(localStorage.getItem("merchantApplications") || "[]");

    applications.unshift({
      ...application,
      submittedAt: new Date().toISOString(),
    });

    localStorage.setItem("merchantApplications", JSON.stringify(applications.slice(0, 20)));
    merchantForm.reset();
    formMessage.textContent = "入驻申请已提交，平台运营人员将尽快与您联系。";
  });
}
