// ======================================
// SWITCH LOGIN / REGISTER
// ======================================

function showLogin() {

    document.getElementById("loginForm")
        .classList.remove("hidden");

    document.getElementById("registerForm")
        .classList.add("hidden");

    document.getElementById("loginTab")
        .classList.add("active");

    document.getElementById("registerTab")
        .classList.remove("active");
}


function showRegister() {

    document.getElementById("loginForm")
        .classList.add("hidden");

    document.getElementById("registerForm")
        .classList.remove("hidden");

    document.getElementById("loginTab")
        .classList.remove("active");

    document.getElementById("registerTab")
        .classList.add("active");
}


// ======================================
// LOGIN
// ======================================

document
    .getElementById("loginForm")
    .addEventListener("submit", async (event) => {

        event.preventDefault();

        const email =
            document.getElementById("loginEmail").value;

        const password =
            document.getElementById("loginPassword").value;

        const message =
            document.getElementById("loginMessage");

        message.textContent = "Logging in...";

        const { data, error } =
            await db.auth.signInWithPassword({
                email,
                password
            });

        if (error) {

            message.textContent = error.message;
            message.className = "message error";

            return;
        }

        window.location.href = "dashboard.html";

    });


// ======================================
// REGISTER
// ======================================

document
    .getElementById("registerForm")
    .addEventListener("submit", async (event) => {

        event.preventDefault();

        const name =
            document.getElementById("registerName").value;

        const email =
            document.getElementById("registerEmail").value;

        const password =
            document.getElementById("registerPassword").value;

        const message =
            document.getElementById("registerMessage");

        message.textContent = "Creating account...";

        const { data, error } =
            await db.auth.signUp({

                email,
                password,

                options: {
                    data: {
                        full_name: name
                    }
                }

            });

        if (error) {

            message.textContent = error.message;
            message.className = "message error";

            return;
        }

        message.textContent =
            "Account created! Check your email if confirmation is enabled.";

        message.className = "message success";

    });


// ======================================
// CHECK EXISTING SESSION
// ======================================

async function checkSession() {

    const { data } =
        await db.auth.getSession();

    if (data.session) {

        window.location.href =
            "dashboard.html";

    }
}

checkSession();