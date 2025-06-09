let dft_data = [];
let user_defined_size = 0;
let dft_size = 0;
let use_user_defined_size = false;

let calculate_dft = true;

// let dft_data = ["3", "-1", "4", "10", "-13", "8", "-5", ""]; // Debug
// let user_defined_size = dft_data.length + 10; // Debug
// let dft_size = user_defined_size; // Debug
// let use_user_defined_size = true; // Debug

let error_times = 1;
let menu_visible = false;
let working = false;

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

function toggle_start_button_state(enabled) {
    const start = document.getElementById("start-button");

    toggle_class(!enabled, start, "cursor-not-allowed", "text-dim-1");
    toggle_class(enabled, start, "text-white");
    start.disabled = !enabled;
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
    toggle_start_button_state(calculate_dft);
}

function create_input() {
    const data_container = document.getElementById("xn-data");
    const current_label = signal_input("");
    const index = data_container.children.length;

    current_label.text = () => current_label.children[0].value.trim();
    current_label.has_text = () => current_label.text() !== "";

    current_label.self_remove_backwards = () => {
        data_container.removeChild(current_label);
        data_container.children[index - 1].has_created_a_child = false;
        data_container.children[index - 1].children[0].focus();
        update_dft_size(false);
    };

    current_label.self_remove_forward = () => {
        if (index + 1 < data_container.children.length)
            data_container.children[index + 1].self_remove_forward();

        if (current_label.has_text())
            return;

        data_container.removeChild(current_label);
        data_container.children[index - 1].has_created_a_child = false;
        data_container.children[index - 1].children[0].focus();
        update_dft_size(false);
    };

    current_label.has_created_a_child = false;
    current_label.children[0].onkeyup = ({ key }) => {
        const contains_text = current_label.has_text();
        dft_data[index] = current_label.text();
        current_label.children[0].style.width = (dft_data[index].length + 3) + 'ch';

        if (key === "Enter") {
            if (contains_text) {
                if (current_label.has_created_a_child)
                    data_container.children[index + 1].children[0].focus();
            } else {
                validate();
            }
        }

        if (key === "Backspace" && !contains_text) {
            if (index === 0)
                return;

            if (current_label.has_created_a_child) {
                current_label.self_remove_forward();
                return;
            }

            current_label.self_remove_backwards();
            return;
        }

        if (current_label.has_created_a_child)
            return;

        if (contains_text) {
            current_label.has_created_a_child = true;
            update_dft_size(true);
            create_input();
        }
    };

    data_container.appendChild(current_label);
}

function clear_element(id) {
    const data = document.getElementById(id);
    if (data === null)
        return;

    for (let i = data.children.length - 1; i > -1; i--)
        data.removeChild(data.children[i]);
}

function clear_xk() {
    clear_element("xk-data");
}

function clear_step_log() {
    clear_element("main-steps");
}

function reset() {
    if (working) {
        set_error_msg("Para reiniciar la aplicación, primero debe terminar el proceso.");
        return;
    }

    const data = document.getElementById("xn-data");
    for (let i = data.children.length - 1; i > 0; i--)
        data.removeChild(data.children[i]);

    clear_xk();

    use_user_defined_size = false;
    user_defined_size = 0;
    document.getElementById("dft-size").value = "";

    dft_data = [];
    dft_size = 0;
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
    if (working) {
        set_error_msg(
            "No se puede cambiar la operación mientras se procesa una señal."
        );
        return;
    }
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

    // Debug
    // validate();
});

function push_step(text, class_data, icon, icon_class_data, action) {
    if (!icon_class_data.includes("size"))
        icon_class_data += " size-6";

    const element = step_label(text, class_data, icon, icon_class_data);
    document.getElementById("main-steps").appendChild(element);
    element.onclick = action;
    return element;
}

function show_result(xk) {
    const data = document.getElementById("xk-data");
    if (data === null)
        return;

    xk.forEach((r, i) => {
        const label = signal_input(r, i + 1 === xk.length ? "hidden" : "");
        label.children[0].disabled = true;
        label.children[0].style.width = (r.length + 3) + 'ch';

        data.appendChild(label);
    });
}

function validate() {
    if (working) {
        set_error_msg("El app ya está en ejecución.");
        return;
    }

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
        push_step("Validar tamaño de los datos", "font-bold", "x_mark", "text-red-600");
        set_error_msg(`No es posible calcular una DFT-${user_defined_size} cuando se ingresaron ${dft_size} datos`);
        return;
    }

    push_step("Validar tamaño de los datos", "font-bold", "check", "text-green-600 dark:text-lime-500");


    const check_class = "text-green-600 dark:text-lime-500";
    const explain_class = "self-center ps-2 mb-4 text-violet-700 dark:text-violet-300";
    const explain_class_ico = "self-center ml-4 mb-4 size-4 text-violet-700 dark:text-violet-300";

    toggle_class(false, "working-icon", "hidden");
    toggle_start_button_state(false);

    const w = new Worker("dft/dft.js");

    let current_element;
    w.addEventListener("message", e => {
        if (e.data.type === "error") {
            set_error_msg(e.data.msg);

            toggle_class(true, "working-icon", "hidden");
            toggle_start_button_state(true);
            working = false;

            if (current_element !== null) {
                toggle_class(true, current_element, "hidden");
                push_step(current_element.children[1].textContent, "font-bold", "x_mark", "text-red-600");
            }

        } else if (e.data.type === "internal") {
            if (e.data.msg === "clear_error") {
                set_error_msg("");
            } else if (e.data.msg === "wn_data") {
                push_step("Ver matriz...", explain_class, "book_open", explain_class_ico, () =>
                    explain_matrix(e.data.value)
                );

            } else if (e.data.msg === "xkn_data") {
                push_step("Ver X(k) sin simplificar...", explain_class, "book_open", explain_class_ico, () =>
                    explain_matrix_multiplication(e.data.value)
                );

            } else if (e.data.msg === "ws_data") {
                push_step("Ver valores...", explain_class, "book_open", explain_class_ico, () =>
                    explain_w_values(e.data.value)
                );

            } else if (e.data.msg === "xk_data") {
                show_result(e.data.value);

                toggle_class(true, "working-icon", "hidden");
                toggle_start_button_state(true);
                working = false;
            }

        } else if (e.data.type === "progress") {
            if (e.data.status === "failed") {
                push_step(e.data.msg, "font-bold", "x_mark", "text-red-600");
                set_error_msg(e.data.error);
                if (current_element !== null)
                    toggle_class(true, current_element, "hidden");
                return;
            } else if (e.data.status === "working") {
                current_element = push_step(e.data.msg, "font-bold text-violet-700 dark:text-violet-300", "ring", "ml-4 size-4 fill-violet-800 dark:fill-white text-violet-400 animate-spin");
                return;
            }

            if (current_element !== null)
                toggle_class(true, current_element, "hidden");
            push_step(e.data.msg, "font-bold", "check", check_class);
        }
    });

    working = true;
    w.postMessage({
        operation: "start",
        dft_data: dft_data, use_user_defined_size: use_user_defined_size,
        user_defined_size: user_defined_size, calculate_dft: calculate_dft
    });
}

function close_instruction() {
    const container = document.getElementById("instructive-view");
    toggle_class(true, container, "opacity-0", "-z-100");
    toggle_class(false, container, "z-100");
}

function show_instruction() {
    const container = document.getElementById("instructive-view");
    toggle_class(false, container, "opacity-0", "-z-100");
    toggle_class(true, container, "z-100");
}

function set_title(title) {
    document.getElementById("instruction-title").textContent = title;
}

function append_to_instruction_body(clear, c) {
    const body = document.getElementById("instruction-body");
    if (clear)
        clear_element("instruction-body");

    body.appendChild(c);
}

function explain_matrix(m_data) {
    show_instruction();
    set_title("Matriz de Fourier");
    const m = matrix(
        "La matriz de Fourier se construye a partir de los factores de giro W. " +
        "Los factores se consiguen a partir de las tres principales propiedades de estos."
    );

    const tex = "W_N = " + m_data;
    append_to_instruction_body(true, m);
    katex.render(tex, m.children[0]);
}

function explain_matrix_multiplication(data) {
    const [m_data, xn_data, xkn_base_tex_data, xkn_tex_data] = data;

    show_instruction();
    set_title("Multiplicación de matrices");
    const m = matrix(
        "La multiplicación se realiza columna por fila. " +
        "Los valores Xk sin simplificar del todo se muestran a continuación."
    );

    let tex = m_data;
    tex += "\\begin{pmatrix}";

    let l1 = [];
    for (let i = 0; i < xn_data.length; i++)
        l1.push(`X(${i + 1})`);

    tex += xn_data.join(" \\\\ \n") + "\\end{pmatrix}";
    tex += `= \\begin{pmatrix}${l1.join(" \\\\ \n")}\\end{pmatrix}`;

    append_to_instruction_body(true, m);
    katex.render(tex, m.children[0]);

    const div = document.createElement("div");
    toggle_class(true, div, "flex", "flex-col", "w-max", "space-y-4");
    m.appendChild(div);
    xkn_tex_data.forEach((e, i) => {
        const x = `X(${i})`;
        const tex = `${x} = ${xkn_base_tex_data[i].join("+")} \\\\ ${"\\ ".repeat(x.length * 2 + x.length / 2)} = ${e}`;
        const span = document.createElement("span");
        div.appendChild(span);
        katex.render(tex, span);
    });
}

function explain_w_values(data) {
    const [euler_data, cis_data, eval_data] = data;

    show_instruction();
    set_title("Valores W's");
    const container = document.createElement("div");
    toggle_class(true, container, "flex", "flex-col", "w-full");

    const div = document.createElement("div");
    toggle_class(true, div, "flex", "flex-col", "w-max", "space-y-4");

    const p = document.createElement("p");
    p.textContent = "Los N/2 valores W se calculan a partir de la definición de Euler de número complejo.";
    div.appendChild(p);

    container.appendChild(div);
    append_to_instruction_body(true, container);

    euler_data.forEach((e, i) => {
        const tex = `W^${i} = ${e} = ${cis_data[i]} = ${eval_data[i]}`;
        const span = document.createElement("span");
        div.appendChild(span);
        katex.render(tex, span);
    });
}
