
let validate_check_index = -1;
let xn = [];  // Input signal
let ws = [];  // W values
let wn = [];  // Fourier matrix
let xkn = []; // X(k) not simplified
let xk = [];

function validate_input_data() {
    validate_check_index = -1;
    for (let i = 0; i < dft_data.length; i++) {
        dft_data[i] = dft_data[i].trim();
        if (!/^[\d.ji-]+$/g.test(dft_data[i])) {
            // console.log(dft_data[i]);
            validate_check_index = i;
            break;
        }

        xn[i] = math.parse(dft_data[i].replaceAll(/j/g, "i"));
        // console.log("xn", i, xn[i].toString(), "from", dft_data[i]);
    }
}

function build_wn() {
    const is_even = xn.length % 2 === 0;
    const semi_n = xn.length / 2;
    const r_semi_n = Math.ceil(xn.length / 2) + (is_even ? 1 : 0);

    for (let j = 0; j < r_semi_n; j++) {
        let negative = false;
        let exp = j;
        let a = [];

        for (let i = 0; i < xn.length; i++) {
            if (j === 0 || i === 0) {
                a.push(new math.ConstantNode(1));
                continue;
            }

            if (is_even && j === semi_n) {
                negative = !negative;
                a.push(new math.ConstantNode(negative ? -1 : 1));
                continue;
            }

            if (exp !== 0) {
                a.push(math.parse(`${negative ? '-' : ''}W^${exp}`));
            } else
                a.push(new math.ConstantNode(negative ? -1 : 1));

            exp += j;
            if (exp > semi_n) {
                negative = !negative;
                exp = exp % semi_n;
            }
        }

        wn.push(a);
        // console.log(a);
    }

    let previous_column = r_semi_n - 1 - (is_even ? 1 : 0);
    for (let j = r_semi_n; j < xn.length; j++) {
        let a = [];

        for (let i = 0; i < xn.length; i++) {
            if (i === 0) {
                a.push(new math.ConstantNode(1));
                continue;
            }

            a.push(wn[previous_column][xn.length - i]);
        }

        previous_column--;
        wn.push(a);
        // console.log(a);
    }
}

function multiply_wn_xn() {
    let tex = [];
    let base_tex = [];

    for (let j = 0; j < xn.length; j++) {
        const base = [];
        for (let i = 0; i < xn.length; i++) {
            const multiplication = new math.OperatorNode(
                "*", "multiply", [xn[i], wn[j][i]]
            );

            base.push(multiplication.toTex());

            if (i === 0)
                xkn[j] = multiplication;
            else
                xkn[j] = new math.OperatorNode(
                    "+", "add", [xkn[j], multiplication]
                );

        }

        base_tex.push(base);
        xkn[j] = math.simplify(xkn[j]);
        tex[j] = xkn[j].toTex();
        // console.log("final", xkn[j].toString());
    }

    return [base_tex, tex];
}

function calculate_ws() {
    // const is_even = xn.length % 2 === 0;
    const semi_n = xn.length / 2;

    const tex_euler = [];
    const tex_cis = [];
    const tex_eval = [];

    for (let i = 0; i < semi_n; i++) {
        // w = e^(-i*2pi/N) = cis(2pi/N)
        const cos = `cos(2*pi*${i}/${xn.length})`;
        const sin = `-sin(2*pi*${i}/${xn.length})`;
        const cos_eval = math.evaluate(cos);
        const sin_eval = math.evaluate(sin);

        ws[i] = math.complex(cos_eval, sin_eval);
        tex_euler.push(`e^{-i\\frac{2\\pi}{${xn.length}}${i}}`);
        tex_cis.push(`cos(\\frac{${i} \\cdot 2\\pi}{${xn.length}}) - isin(\\frac{${i} \\cdot 2\\pi}{${xn.length}})`);
        tex_eval.push(ws[i].toString());
    }

    return [tex_euler, tex_cis, tex_eval];
}

function evaluate_xkn() {
    /*
    let scope = {};
    for (let i = 1; i < ws.length; i++)
        scope["W^" + i] = ws[i].toString();

    for (let i = 0; i < xkn.length; i++)
        xkn[i] = math.simplify(xkn[i].toString(), scope);
    */

    let scope = [];
    for (let i = 0; i < ws.length; i++)
        // scope.push(`(${ws[i].toString()})`);
        scope.push(`(${ws[i]})`);

    for (let i = 0; i < xkn.length; i++) {
        xk[i] = xkn[i].toString();

        for (let j = ws.length - 1; j > -1; j--)
            xk[i] = xk[i].replaceAll(j !== 1 ? "W ^ " + j : "W", scope[j]);

        xk[i] = math.evaluate(xk[i]);
        // console.log(`X(${i}) =`, xk[i].toString());
    }
}

function show_result() {
    const data = document.getElementById("xk-data");
    if (data === null)
        return;

    xk.forEach(r => {
        const text = math.format(r, { notation: 'fixed', precision: 3 });
        const label = signal_input(text);
        label.children[0].disabled = true;
        label.children[0].style.width = (text.length + 3) + 'ch';

        data.appendChild(label);
    });
}

function perform_operation() {
    if (!calculate_dft) {
        set_error_msg("Función no implementada");
        return;
    }

    set_error_msg("");

    try {
        validate_input_data();
        if (validate_check_index !== -1) {
            push_step("Validar señal de entrada", "font-bold", "x_mark", "text-red-600");
            set_error_msg(`El valor en la posición ${validate_check_index + 1} (${dft_data[validate_check_index]}) contiene cáracteres no validos`);
            return;
        }
    } catch (e) {
        push_step("Validar señal de entrada", "font-bold", "x_mark", "text-red-600");
        set_error_msg(`El valor en la posición ${validate_check_index + 1} (${dft_data[validate_check_index]}) es inválido`);
        return;
    }

    ws = [];
    wn = [];
    xkn = [];

    if (use_user_defined_size) {
        while (xn.length < user_defined_size)
            xn.push(new math.ConstantNode(0));
    }

    const check_class = "text-green-600 dark:text-lime-500";
    const explain_class = "ps-4 mb-4 text-violet-700 dark:text-violet-300";

    push_step("Validar señal de entrada", "font-bold", "check", check_class);

    build_wn();
    push_step("Construir matriz de Fourier", "font-bold", "check", check_class);
    push_step("Ver matriz...", explain_class, "", "", () =>
        explain_matrix(wn)
    );

    const [xkn_base_tex, xkn_tex] = multiply_wn_xn();

    push_step("Multiplicar matrices", "font-bold", "check", check_class);
    push_step("Ver X(k) sin simplificar...", explain_class, "", "", () =>
        explain_matrix_multiplication(wn, xn, xkn_base_tex, xkn_tex)
    );

    const [euler, cis, ev] = calculate_ws();
    push_step("Calcular valores W", "font-bold", "check", check_class);
    push_step("Ver valores...", explain_class, "", "", () =>
        explain_w_values(euler, cis, ev)
    );

    evaluate_xkn();
    push_step("Calcular resultado", "font-bold", "check", check_class);
    // push_step("Ver pasos", "ps-4");

    show_result();
    // xn.forEach(e => console.log(e));
}
