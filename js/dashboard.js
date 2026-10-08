// ============================================
// GLOBAL DATA
// ============================================

let subscriptions = [];
let currentUser = null;
let expenseChart = null;


// ============================================
// INITIALIZE
// ============================================

async function initializeDashboard() {

    const { data, error } =
        await db.auth.getUser();

    if (error || !data.user) {

        window.location.href = "index.html";

        return;
    }

    currentUser = data.user;

    document.getElementById("userName").textContent =
        currentUser.user_metadata?.full_name ||
        currentUser.email;

    await loadSubscriptions();
}


// ============================================
// LOAD SUBSCRIPTIONS
// ============================================

async function loadSubscriptions() {

    const { data, error } =
        await db
            .from("subscriptions")
            .select("*")
            .order("next_payment", {
                ascending: true
            });


    // FIXED ERROR CHECK
    if (error) {

        console.error(
            "Load subscriptions error:",
            error
        );

        alert(
            "Unable to load subscriptions: " +
            error.message
        );

        return;
    }


    subscriptions = data || [];

    updateDashboard();
}


// ============================================
// UPDATE EVERYTHING
// ============================================

function updateDashboard() {

    calculateStats();

    renderSubscriptions();

    renderCategories();

    renderChart();
}


// ============================================
// CALCULATE STATS
// ============================================

function calculateStats() {

    const active =
        subscriptions.filter(
            sub => sub.status === "Active"
        );


    let monthly = 0;

    let yearly = 0;


    active.forEach(sub => {

        const price =
            Number(sub.price);


        if (sub.billing_cycle === "Monthly") {

            monthly += price;

        }

        else if (sub.billing_cycle === "Yearly") {

            monthly += price / 12;

        }

        else if (sub.billing_cycle === "Weekly") {

            monthly += price * 4.33;

        }

    });


    yearly = monthly * 12;


    document.getElementById("monthlyTotal")
        .textContent =
        formatCurrency(monthly);


    document.getElementById("yearlyTotal")
        .textContent =
        formatCurrency(yearly);


    document.getElementById("activeCount")
        .textContent =
        active.length;


    const today = new Date();


    const next30 =
        new Date();

    next30.setDate(
        today.getDate() + 30
    );


    const upcoming =
        active.filter(sub => {

            const date =
                new Date(sub.next_payment);

            return date >= today &&
                   date <= next30;

        });


    document.getElementById("upcomingCount")
        .textContent =
        upcoming.length;
}


// ============================================
// RENDER SUBSCRIPTIONS
// ============================================

function renderSubscriptions() {

    const tbody =
        document.getElementById(
            "subscriptionTable"
        );


    const search =
        document.getElementById(
            "searchInput"
        ).value.toLowerCase();


    const filtered =
        subscriptions.filter(sub =>

            sub.name
                .toLowerCase()
                .includes(search)

            ||

            sub.category
                .toLowerCase()
                .includes(search)

        );


    if (filtered.length === 0) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="empty"
                >

                    No subscriptions found.

                </td>

            </tr>

        `;

        return;
    }


    tbody.innerHTML =
        filtered.map(sub => `

        <tr>

            <td>

                <div class="sub-name">

                    <div class="sub-avatar">

                        ${sub.name
                            .charAt(0)
                            .toUpperCase()}

                    </div>


                    <strong>

                        ${escapeHTML(sub.name)}

                    </strong>

                </div>

            </td>


            <td>

                ${escapeHTML(sub.category)}

            </td>


            <td>

                ${formatCurrency(sub.price)}

            </td>


            <td>

                ${sub.billing_cycle}

            </td>


            <td>

                ${formatDate(sub.next_payment)}

            </td>


            <td>

                <span
                    class="status ${sub.status.toLowerCase()}"
                >

                    ${sub.status}

                </span>

            </td>


            <td>

                <button
                    class="action-btn"
                    onclick="editSubscription('${sub.id}')"
                >

                    Edit

                </button>


                <button
                    class="delete-btn"
                    onclick="deleteSubscription('${sub.id}')"
                >

                    Delete

                </button>

            </td>

        </tr>

    `).join("");
}


// ============================================
// ADD / EDIT SUBSCRIPTION
// ============================================

document
    .getElementById("subscriptionForm")
    .addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const id =
                document.getElementById(
                    "subscriptionId"
                ).value;


            const subscription = {

                user_id:
                    currentUser.id,

                name:
                    document.getElementById(
                        "subName"
                    ).value,

                category:
                    document.getElementById(
                        "subCategory"
                    ).value,

                price:
                    Number(
                        document.getElementById(
                            "subPrice"
                        ).value
                    ),

                billing_cycle:
                    document.getElementById(
                        "subCycle"
                    ).value,

                start_date:
                    document.getElementById(
                        "startDate"
                    ).value,

                next_payment:
                    document.getElementById(
                        "nextPayment"
                    ).value,

                status:
                    document.getElementById(
                        "subStatus"
                    ).value,

                notes:
                    document.getElementById(
                        "subNotes"
                    ).value

            };


            let result;


            // EDIT
            if (id) {

                result =
                    await db
                        .from("subscriptions")
                        .update(subscription)
                        .eq("id", id);

            }

            // ADD
            else {

                result =
                    await db
                        .from("subscriptions")
                        .insert(subscription);

            }


            if (result.error) {

                console.error(
                    "Save subscription error:",
                    result.error
                );

                alert(
                    "Failed to save subscription: " +
                    result.error.message
                );

                return;
            }


            closeModal();

            await loadSubscriptions();

        }
    );


// ============================================
// EDIT SUBSCRIPTION
// ============================================

function editSubscription(id) {

    const sub =
        subscriptions.find(
            item => item.id === id
        );


    if (!sub) return;


    document.getElementById(
        "subscriptionId"
    ).value = sub.id;


    document.getElementById(
        "subName"
    ).value = sub.name;


    document.getElementById(
        "subCategory"
    ).value = sub.category;


    document.getElementById(
        "subPrice"
    ).value = sub.price;


    document.getElementById(
        "subCycle"
    ).value = sub.billing_cycle;


    document.getElementById(
        "startDate"
    ).value = sub.start_date;


    document.getElementById(
        "nextPayment"
    ).value = sub.next_payment;


    document.getElementById(
        "subStatus"
    ).value = sub.status;


    document.getElementById(
        "subNotes"
    ).value =
        sub.notes || "";


    document.getElementById(
        "modalTitle"
    ).textContent =
        "Edit Subscription";


    openModal();
}


// ============================================
// DELETE SUBSCRIPTION
// ============================================

async function deleteSubscription(id) {

    const confirmed =
        confirm(
            "Delete this subscription?"
        );


    if (!confirmed) return;


    const { error } =
        await db
            .from("subscriptions")
            .delete()
            .eq("id", id);


    if (error) {

        alert(
            "Unable to delete subscription."
        );

        console.error(error);

        return;
    }


    await loadSubscriptions();
}


// ============================================
// MODAL
// ============================================

function openModal() {

    document.getElementById(
        "subscriptionModal"
    ).classList.add("show");
}


function closeModal() {

    document.getElementById(
        "subscriptionModal"
    ).classList.remove("show");


    document.getElementById(
        "subscriptionForm"
    ).reset();


    document.getElementById(
        "subscriptionId"
    ).value = "";


    document.getElementById(
        "modalTitle"
    ).textContent =
        "Add Subscription";
}


// ============================================
// CATEGORY ANALYTICS
// ============================================

function renderCategories() {

    const container =
        document.getElementById(
            "categoryList"
        );


    const categories = {};


    subscriptions
        .filter(
            sub =>
                sub.status === "Active"
        )
        .forEach(sub => {

            let monthlyPrice =
                Number(sub.price);


            if (
                sub.billing_cycle ===
                "Yearly"
            ) {

                monthlyPrice /= 12;

            }

            else if (
                sub.billing_cycle ===
                "Weekly"
            ) {

                monthlyPrice *= 4.33;

            }


            if (!categories[sub.category]) {

                categories[sub.category] = 0;

            }


            categories[sub.category] +=
                monthlyPrice;

        });


    const sorted =
        Object.entries(categories)
            .sort(
                (a, b) =>
                    b[1] - a[1]
            );


    if (sorted.length === 0) {

        container.innerHTML =
            "<p>No data available.</p>";

        return;
    }


    const total =
        sorted.reduce(
            (sum, item) =>
                sum + item[1],
            0
        );


    container.innerHTML =
        sorted.map(
            ([category, amount]) => {

                const percentage =
                    total
                        ? (amount / total) * 100
                        : 0;


                return `

                    <div class="category-item">

                        <div class="category-top">

                            <span>

                                ${escapeHTML(category)}

                            </span>


                            <strong>

                                ${formatCurrency(amount)}

                            </strong>

                        </div>


                        <div class="progress">

                            <div
                                style="width: ${percentage}%"
                            ></div>

                        </div>

                    </div>

                `;

            }
        ).join("");
}


// ============================================
// CHART
// ============================================

function renderChart() {

    const canvas =
        document.getElementById(
            "expenseChart"
        );


    if (!canvas) return;


    const ctx =
        canvas.getContext("2d");


    const categories = {};


    subscriptions
        .filter(
            sub =>
                sub.status === "Active"
        )
        .forEach(sub => {

            let amount =
                Number(sub.price);


            if (
                sub.billing_cycle ===
                "Yearly"
            ) {

                amount /= 12;

            }

            else if (
                sub.billing_cycle ===
                "Weekly"
            ) {

                amount *= 4.33;

            }


            categories[sub.category] =
                (categories[sub.category] || 0)
                + amount;

        });


    if (expenseChart) {

        expenseChart.destroy();

    }


    expenseChart =
        new Chart(ctx, {

            type: "doughnut",


            data: {

                labels:
                    Object.keys(categories),


                datasets: [

                    {

                        data:
                            Object.values(
                                categories
                            ),

                        borderWidth: 0

                    }

                ]

            },


            options: {

                responsive: true,


                plugins: {

                    legend: {

                        position:
                            "bottom"

                    }

                }

            }

        });

}


// ============================================
// LOGOUT
// ============================================

async function logout() {

    await db.auth.signOut();

    window.location.href =
        "index.html";
}


// ============================================
// HELPERS
// ============================================

function formatCurrency(value) {

    return new Intl.NumberFormat(
        "en-IN",
        {

            style: "currency",

            currency: "INR",

            maximumFractionDigits: 0

        }
    ).format(value);

}


function formatDate(date) {

    return new Date(date)
        .toLocaleDateString(
            "en-IN",
            {

                day: "2-digit",

                month: "short",

                year: "numeric"

            }
        );

}


function escapeHTML(value) {

    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ============================================
// SIDEBAR NAVIGATION
// ============================================

function showSection(sectionName) {

    const sections = {

        dashboard:
            document.getElementById(
                "dashboardSection"
            ),

        subscriptions:
            document.getElementById(
                "subscriptionsSection"
            ),

        analytics:
            document.getElementById(
                "analyticsSection"
            )

    };


    // Hide all sections

    Object.values(sections).forEach(section => {

        if (section) {

            section.classList.remove("active");

        }

    });


    // Show selected section

    if (sections[sectionName]) {

        sections[sectionName]
            .classList.add("active");

    }


    // Update sidebar active item

    document
        .querySelectorAll(".nav-item")
        .forEach(item => {

            item.classList.remove("active");

        });


    const selectedNav =
        document.querySelector(
            `.nav-item[data-section="${sectionName}"]`
        );


    if (selectedNav) {

        selectedNav.classList.add("active");

    }


    // Keep chart correctly rendered
    // when Analytics is opened

    if (
        sectionName === "analytics" &&
        subscriptions.length >= 0
    ) {

        setTimeout(() => {

            renderChart();

        }, 50);

    }


    // Render subscriptions when opened

    if (
        sectionName === "subscriptions"
    ) {

        renderSubscriptions();

    }

}


// ============================================
// SIDEBAR CLICK EVENTS
// ============================================

document
    .querySelectorAll(".nav-item")
    .forEach(item => {

        item.addEventListener(
            "click",
            event => {

                event.preventDefault();


                const section =
                    item.dataset.section;


                showSection(section);


                // Update URL hash

                window.history.replaceState(
                    null,
                    "",
                    "#" + section
                );

            }
        );

    });


// ============================================
// OPEN SECTION FROM URL HASH
// ============================================

function loadSectionFromHash() {

    const hash =
        window.location.hash
            .replace("#", "");


    if (
        hash === "subscriptions" ||
        hash === "analytics" ||
        hash === "dashboard"
    ) {

        showSection(hash);

    }

    else {

        showSection("dashboard");

    }

}


// ============================================
// START
// ============================================

initializeDashboard();

loadSectionFromHash();