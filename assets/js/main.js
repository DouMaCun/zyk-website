const merchantForm = document.querySelector("#merchantForm");
const formMessage = document.querySelector("#formMessage");
const userStoreKey = "zykUsers";
const sessionStoreKey = "zykCurrentUser";

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

const parseStoredArray = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const parseStoredObject = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
};

const saveUsers = (users) => {
  localStorage.setItem(userStoreKey, JSON.stringify(users));
};

const browserCrypto = window.crypto || window.msCrypto;

const getCurrentUser = () => parseStoredObject(sessionStoreKey);

const setCurrentUser = (user) => {
  localStorage.setItem(
    sessionStoreKey,
    JSON.stringify({
      id: user.id,
      name: user.name,
      phone: user.phone,
      loginAt: new Date().toISOString(),
    }),
  );
};

const bytesToHex = (buffer) =>
  [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, "0")).join("");

const createSalt = () => {
  const bytes = new Uint8Array(16);
  if (browserCrypto?.getRandomValues) {
    browserCrypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

const hashPassword = async (password, salt) => {
  const value = `${salt}:${password}`;

  if (browserCrypto?.subtle) {
    const data = new TextEncoder().encode(value);
    const digest = await browserCrypto.subtle.digest("SHA-256", data);
    return `sha256-${bytesToHex(digest)}`;
  }

  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return `fallback-${(hash >>> 0).toString(16)}`;
};

const normalizePhone = (value) => value.trim().replace(/\s/g, "");

const showMessage = (element, message, isError = false) => {
  element.textContent = message;
  element.classList.toggle("is-error", isError);
};

const updateAuthHeader = () => {
  const currentUser = getCurrentUser();

  document.querySelectorAll("[data-auth-guest]").forEach((element) => {
    element.hidden = Boolean(currentUser);
  });

  document.querySelectorAll("[data-auth-user]").forEach((element) => {
    element.hidden = !currentUser;
  });

  document.querySelectorAll("[data-auth-name]").forEach((element) => {
    element.textContent = currentUser ? `${currentUser.name}，已登录` : "";
  });
};

const buildAuthDialog = () => {
  if (!document.querySelector("[data-auth-open]")) {
    return null;
  }

  document.body.insertAdjacentHTML(
    "beforeend",
    `<dialog class="auth-dialog" id="authDialog" aria-labelledby="authDialogTitle">
      <div class="auth-panel">
        <div class="auth-panel-header">
          <div>
            <h2 id="authDialogTitle">账号登录</h2>
            <p id="authDialogCopy">登录后将保持当前账户状态。</p>
          </div>
          <button class="auth-close" type="button" data-auth-close aria-label="关闭">×</button>
        </div>
        <div class="auth-tabs" role="tablist" aria-label="账号操作">
          <button class="auth-tab is-active" type="button" data-auth-mode="login">登录</button>
          <button class="auth-tab" type="button" data-auth-mode="register">注册</button>
        </div>
        <form class="auth-form" id="loginForm" data-auth-form="login">
          <label>
            手机号
            <input type="tel" name="phone" autocomplete="tel" placeholder="请输入注册手机号" required />
          </label>
          <label>
            密码
            <input type="password" name="password" autocomplete="current-password" placeholder="请输入密码" minlength="6" required />
          </label>
          <button class="button button-primary" type="submit">登录</button>
          <p class="auth-message" data-auth-message="login" role="status" aria-live="polite"></p>
        </form>
        <form class="auth-form" id="registerForm" data-auth-form="register" hidden>
          <label>
            姓名
            <input type="text" name="name" autocomplete="name" placeholder="请输入姓名" required />
          </label>
          <label>
            手机号
            <input type="tel" name="phone" autocomplete="tel" placeholder="请输入手机号" pattern="^1[3-9][0-9]{9}$" required />
          </label>
          <label>
            设置密码
            <input type="password" name="password" autocomplete="new-password" placeholder="至少 6 位" minlength="6" required />
          </label>
          <label>
            确认密码
            <input type="password" name="confirmPassword" autocomplete="new-password" placeholder="请再次输入密码" minlength="6" required />
          </label>
          <button class="button button-primary" type="submit">注册并登录</button>
          <p class="auth-message" data-auth-message="register" role="status" aria-live="polite"></p>
        </form>
      </div>
    </dialog>`,
  );

  return document.querySelector("#authDialog");
};

const authDialog = buildAuthDialog();

if (authDialog) {
  const title = authDialog.querySelector("#authDialogTitle");
  const copy = authDialog.querySelector("#authDialogCopy");
  const loginForm = authDialog.querySelector("#loginForm");
  const registerForm = authDialog.querySelector("#registerForm");
  const loginMessage = authDialog.querySelector('[data-auth-message="login"]');
  const registerMessage = authDialog.querySelector('[data-auth-message="register"]');

  const setAuthMode = (mode) => {
    const isLogin = mode === "login";
    title.textContent = isLogin ? "账号登录" : "账号注册";
    copy.textContent = isLogin ? "登录后将保持当前账户状态。" : "注册后将自动登录当前浏览器。";
    loginForm.hidden = !isLogin;
    registerForm.hidden = isLogin;
    authDialog.querySelectorAll("[data-auth-mode]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.authMode === mode);
    });
    showMessage(loginMessage, "");
    showMessage(registerMessage, "");
  };

  const openAuthDialog = (mode) => {
    setAuthMode(mode);
    if (typeof authDialog.showModal === "function") {
      authDialog.showModal();
    } else {
      authDialog.setAttribute("open", "");
    }
    const firstInput = authDialog.querySelector(`[data-auth-form="${mode}"] input`);
    firstInput?.focus();
  };

  const closeAuthDialog = () => {
    if (typeof authDialog.close === "function") {
      authDialog.close();
    } else {
      authDialog.removeAttribute("open");
    }
  };

  document.querySelectorAll("[data-auth-open]").forEach((button) => {
    button.addEventListener("click", () => openAuthDialog(button.dataset.authOpen));
  });

  document.querySelectorAll("[data-auth-logout]").forEach((button) => {
    button.addEventListener("click", () => {
      localStorage.removeItem(sessionStoreKey);
      updateAuthHeader();
    });
  });

  authDialog.querySelector("[data-auth-close]").addEventListener("click", closeAuthDialog);

  authDialog.addEventListener("click", (event) => {
    if (event.target === authDialog) {
      closeAuthDialog();
    }
  });

  authDialog.querySelectorAll("[data-auth-mode]").forEach((button) => {
    button.addEventListener("click", () => setAuthMode(button.dataset.authMode));
  });

  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(registerForm);
    const name = String(formData.get("name") || "").trim();
    const phone = normalizePhone(String(formData.get("phone") || ""));
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    if (password !== confirmPassword) {
      showMessage(registerMessage, "两次输入的密码不一致。", true);
      return;
    }

    const users = parseStoredArray(userStoreKey);
    if (users.some((user) => user.phone === phone)) {
      showMessage(registerMessage, "该手机号已注册，请直接登录。", true);
      return;
    }

    const salt = createSalt();
    const user = {
      id: browserCrypto?.randomUUID ? browserCrypto.randomUUID() : `user-${Date.now()}`,
      name,
      phone,
      salt,
      passwordHash: await hashPassword(password, salt),
      createdAt: new Date().toISOString(),
    };

    users.unshift(user);
    saveUsers(users);
    setCurrentUser(user);
    registerForm.reset();
    updateAuthHeader();
    showMessage(registerMessage, "注册成功，已登录。");
    window.setTimeout(closeAuthDialog, 600);
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);
    const phone = normalizePhone(String(formData.get("phone") || ""));
    const password = String(formData.get("password") || "");
    const users = parseStoredArray(userStoreKey);
    const user = users.find((item) => item.phone === phone);

    if (!user) {
      showMessage(loginMessage, "账号不存在，请先注册。", true);
      return;
    }

    const passwordHash = await hashPassword(password, user.salt);
    if (passwordHash !== user.passwordHash) {
      showMessage(loginMessage, "手机号或密码不正确。", true);
      return;
    }

    setCurrentUser(user);
    loginForm.reset();
    updateAuthHeader();
    showMessage(loginMessage, "登录成功。");
    window.setTimeout(closeAuthDialog, 500);
  });
}

updateAuthHeader();
