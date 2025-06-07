let dft_size = 0;
let use_user_defined_size = false;
let user_defined_size = 0;

let calculate_dft = true;

let error_times = 1;
let menu_visible = false;

function toggle_class(add, element, ...classes) {
    if (typeof element === "string")
        element = document.getElementById(element);

    if (element === null)
        return;

    classes.forEach(c => {
        if (add)
            element.classList.add(c);
        else
            element.classList.remove(c);
    });
}

function update_dft_size(increase) {
    if (increase !== null) {
        if (dft_size === 0 && !increase)
            return;

        dft_size += increase ? 1 : -1;
    }

    const s = use_user_defined_size ? user_defined_size : dft_size === 0 ? 1 : dft_size;
    let name = calculate_dft ? "DFT" : "iDFT";

    document.getElementById("dft-size").placeholder = s;
    document.getElementById("active-mode").textContent = name;
    document.getElementById("title").textContent = name;

    const start = document.getElementById("start-button");
    start.textContent = `Calcular ${name}-${s}`;
    toggle_class(!calculate_dft, start, "cursor-not-allowed", "text-dim-1");
    toggle_class(calculate_dft, start, "text-white");
    start.disabled = !calculate_dft;
}

function create_input() {
    const data = document.getElementById("xn-data");
    const label = signal_input();
    const index = data.children.length;

    label.has_text = () => label.children[0].value.trim() !== "";

    label.self_remove_backwards = () => {
        data.removeChild(label);
        data.children[index - 1].has_created_a_child = false;
        data.children[index - 1].children[0].focus();
        update_dft_size(false);
    };

    label.self_remove_forward = () => {
        if (index + 1 < data.children.length)
            data.children[index + 1].self_remove_forward();

        if (label.has_text())
            return;

        data.removeChild(label);
        data.children[index - 1].has_created_a_child = false;
        data.children[index - 1].children[0].focus();
        update_dft_size(false);
    };

    label.has_created_a_child = false;
    label.children[0].onkeyup = ({ key }) => {
        const contains_text = label.has_text();

        if (key === "Enter") {
            if (contains_text) {
                if (label.has_created_a_child)
                    data.children[index + 1].children[0].focus();
            } else {
                console.log("Start cal");
            }
        }

        if (key === "Backspace" && !contains_text) {
            if (index === 0)
                return;

            if (label.has_created_a_child) {
                label.self_remove_forward();
                return;
            }

            label.self_remove_backwards();
            return;
        }

        if (label.has_created_a_child)
            return;

        if (contains_text) {
            label.has_created_a_child = true;
            update_dft_size(true);
            create_input();
        }
    };

    data.appendChild(label);
}

function remove_all() {
    const data = document.getElementById("xn-data");
    for (let i = data.children.length - 1; i > 0; i--)
        data.removeChild(data.children[i]);

    use_user_defined_size = false;
    user_defined_size = 0;
    document.getElementById("dft-size").value = "";

    dft_size = 1;
    data.children[0].children[0].value = "";
    data.children[0].has_created_a_child = false;
    calc_mode_is_dft(true);
}

function set_error_msg(msg) {
    const container = document.getElementById("error-msg");
    if (msg.length === 0) {
        error_times = 1;
        toggle_class(true, container, "hidden");
        return;
    }

    container.classList.remove("hidden");
    document.getElementById("error-count").textContent = `Error (${error_times})`;
    error_times++;

    document.getElementById("error-text").textContent = msg;
}

function toggle_menu_visibility(show) {
    const menu = document.getElementById("dft-menu");
    const button = document.getElementById("menu-button");

    menu_visible = show;

    toggle_class(!show, menu, "opacity-0", "-translate-y-full");
    toggle_class(show, menu, "translate-y-10");

    toggle_class(!show, button, "rounded-lg");
    toggle_class(show, button, "rounded-t-lg");
}

function toggle_menu() {
    toggle_menu_visibility(!menu_visible);
}

function calc_mode_is_dft(calc_dft) {
    toggle_menu_visibility(false);
    calculate_dft = calc_dft;
    update_dft_size(null);
}

document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", (evt) => {
        if (!document.getElementById("dft-menu").contains(evt.target)
            && !document.getElementById("menu-button").contains(evt.target))
            toggle_menu_visibility(false);
    });

    document.getElementById("dft-size").onkeyup = () => {
        const text = document.getElementById("dft-size").value;
        use_user_defined_size = /^\d+$/g.test(text);
        user_defined_size = use_user_defined_size ? parseInt(text) : 0;
        update_dft_size(null);
    };
});
