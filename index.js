let dft_size = 0;
let use_user_defined_size = false;
let user_defined_size = 0;

let calculate_dft = true;

let dft_data = [];
// let dft_data = ["3", "-1", "4", "10", "-13", "8", "-5", ""]; // Debug
// let user_defined_size = dft_data.length; // Debug
// let use_user_defined_size = true; // Debug

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
    const label = signal_input("");
    const index = data.children.length;

    label.text = () => label.children[0].value.trim();
    label.has_text = () => label.text() !== "";

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
        dft_data[index] = label.text();
        label.children[0].style.width = (dft_data[index].length + 3) + 'ch';

        if (key === "Enter") {
            if (contains_text) {
                if (label.has_created_a_child)
                    data.children[index + 1].children[0].focus();
            } else {
                validate();
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

function clear_xk() {
    const data = document.getElementById("xk-data");
    for (let i = data.children.length - 1; i > -1; i--)
        data.removeChild(data.children[i]);
}

function clear_step_log() {
    const container = document.getElementById("main-steps");
    for (let i = container.children.length - 1; i > -1; i--)
        container.removeChild(container.children[i]);
}

function remove_all() {
    const data = document.getElementById("xn-data");
    for (let i = data.children.length - 1; i > 0; i--)
        data.removeChild(data.children[i]);

    clear_xk();

    use_user_defined_size = false;
    user_defined_size = 0;
    document.getElementById("dft-size").value = "";

    dft_data = [];
    dft_size = 1;
    data.children[0].children[0].value = "";
    data.children[0].has_created_a_child = false;
    calc_mode_is_dft(true);

    clear_step_log();
}

function set_error_msg(msg) {
    const container = document.getElementById("error-msg");
    if (msg.length === 0) {
        error_times = 1;
        toggle_class(true, container, "translate-y-full");
        return;
    }

    toggle_class(false, container, "translate-y-full");
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

function push_step(text, class_data, icon, icon_class_data) {
    document.getElementById("main-steps").appendChild(
        step_label(text, class_data, icon, icon_class_data)
    );
}

function validate() {
    clear_step_log();
    clear_xk();

    dft_data = dft_data.filter(e => /^[\w-.]+$/g.test(e));

    if (dft_data.length <= 1) {
        push_step("Leer datos", "font-bold", "x_mark", "text-red-600");
        set_error_msg("No hay datos suficientes.");
        return;
    }

    push_step("Leer datos", "font-bold", "check", "text-green-600 dark:text-lime-500");

    if (use_user_defined_size && user_defined_size < dft_size) {
        push_step("Validar tamaño datos", "font-bold", "x_mark", "text-red-600");
        set_error_msg(`No es posible calcular una DFT-${user_defined_size} cuando se ingresaron ${dft_size} datos`);
        return;
    }

    push_step("Validar tamaño datos", "font-bold", "check", "text-green-600 dark:text-lime-500");

    perform_operation();
}
