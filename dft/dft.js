importScripts("math.14.5.2.js");
importScripts("algebra-0.2.6.min.js");


function validate_input_data(dft_data) {
    let validate_check_index = -1;
    let xn = [];
    for (let i = 0; i < dft_data.length; i++) {
        dft_data[i] = dft_data[i].trim();
        if (!/^[\d.ji-]+$/g.test(dft_data[i])) {
            // console.log(dft_data[i]);
            validate_check_index = i;
            break;
        }

        xn.push(math.parse(dft_data[i].replaceAll(/j/g, "i")).toString());
        // console.log("xn", i, xn[i].toString(), "from", dft_data[i]);
    }

    return [validate_check_index, xn];
}

function build_wn(xn_length) {
    const wn = [];
    let tex = "\\begin{pmatrix}\n";
    let tex_matrix = [];

    const is_even = xn_length % 2 === 0;
    const semi_n = xn_length / 2;
    const r_semi_n = Math.ceil(xn_length / 2) + (is_even ? 1 : 0);

    for (let j = 0; j < r_semi_n; j++) {
        let negative = false;
        let exp = j;

        const row = [];
        const tex_row = [];

        for (let i = 0; i < xn_length; i++) {
            if (j === 0 || i === 0) {
                row.push("1");
                tex_row.push("1");
                continue;
            }

            if (is_even && j === semi_n) {
                negative = !negative;
                const v = "" + (negative ? -1 : 1);
                row.push(v);
                tex_row.push(v);
                continue;
            }

            const v = exp !== 0 ? math.parse(`${negative ? '-' : ''}W^${exp}`) :
                "" + (negative ? -1 : 1);

            row.push(v.toString());
            tex_row.push(typeof v === "string" ? v : v.toTex());

            exp += j;
            if (exp > semi_n) {
                negative = !negative;
                exp = exp % semi_n;
            }
        }

        wn.push(row);
        tex_matrix.push(tex_row);
        tex += tex_row.join(" & ") + "\\\\";
        // console.log(a);
    }

    let previous_column = r_semi_n - 1 - (is_even ? 1 : 0);
    for (let j = r_semi_n; j < xn_length; j++) {
        const row = [];
        const tex_row = [];

        for (let i = 0; i < xn_length; i++) {
            if (i === 0) {
                row.push("1");
                tex_row.push("1");
                continue;
            }

            row.push(wn[previous_column][xn_length - i]);
            tex_row.push(tex_matrix[previous_column][xn_length - i]);
        }

        previous_column--;
        wn.push(row);
        tex += tex_row.join(" & ") + "\\\\";
        // console.log(a);
    }

    return [wn, tex + "\\end{pmatrix}"];
}

function multiply_wn_xn(xn, wn) {
    const xkn = [];

    let tex = [];
    let base_tex = [];

    for (let j = 0; j < xn.length; j++) {
        const base = [];
        for (let i = 0; i < xn.length; i++) {
            const multiplication = new algebra.parse(xn[i])
                .multiply(new algebra.parse(wn[j][i]));

            base.push(multiplication.toTex());

            if (i === 0)
                xkn[j] = multiplication;
            else
                xkn[j] = xkn[j].add(multiplication);
        }

        base_tex.push(base);
        tex[j] = xkn[j].toTex();
        // console.log("final", xkn[j].toString());
    }

    return [xkn, base_tex, tex];
}

function calculate_ws(xn_length) {
    const ws = [];

    // const is_even = xn_length % 2 === 0;
    const semi_n = xn_length / 2;

    const tex_euler = [];
    const tex_cis = [];
    const tex_eval = [];

    for (let i = 0; i < semi_n; i++) {
        // w = e^(-i*2pi/N) = cis(2pi/N)
        const cos = `cos(2*pi*${i}/${xn_length})`;
        const sin = `-sin(2*pi*${i}/${xn_length})`;
        const cos_eval = math.evaluate(cos);
        const sin_eval = math.evaluate(sin);

        ws[i] = math.complex(cos_eval, sin_eval);
        tex_euler.push(`e^{-i\\frac{2\\pi}{${xn_length}}${i}}`);
        tex_cis.push(`cos(\\frac{${i} \\cdot 2\\pi}{${xn_length}}) - isin(\\frac{${i} \\cdot 2\\pi}{${xn_length}})`);
        tex_eval.push(ws[i].toString());
    }

    return [ws, tex_euler, tex_cis, tex_eval];
}

function evaluate_xkn(ws, xkn) {
    /*
    let scope = {};
    for (let i = 1; i < ws.length; i++)
        scope["W^" + i] = ws[i].toString();

    for (let i = 0; i < xkn.length; i++)
        xkn[i] = math.simplify(xkn[i].toString(), scope);
    */

    const xk = [];

    let scope = [];
    for (let i = 0; i < ws.length; i++)
        // scope.push(`(${ws[i].toString()})`);
        scope.push(`(${ws[i]})`);

    for (let i = 0; i < xkn.length; i++) {
        xk[i] = xkn[i].toString();

        for (let j = ws.length - 1; j > -1; j--)
            xk[i] = xk[i].replaceAll(j !== 1 ? "W ^ " + j : "W", scope[j]);

        xk[i] = math.format(math.evaluate(xk[i]), { notation: 'fixed', precision: 3 })
        // console.log(`X(${i}) =`, xk[i].toString());
    }

    return xk;
}

function perform_operation(
    { dft_data, use_user_defined_size, user_defined_size, calculate_dft }
) {
    let validate_check_index = -1;

    // Input signal in mathjs representation
    let xn = [];

    if (!calculate_dft) {
        postMessage({ type: "error", msg: "Función no implementada" });
        return;
    }

    postMessage({ type: "internal", msg: "clear_error" });
    postMessage({ type: "progress", msg: "Validar señal de entrada", status: "working" });

    try {
        [validate_check_index, xn] = validate_input_data(dft_data);
        if (validate_check_index !== -1) {
            postMessage({
                type: "progress", msg: "Validar señal de entrada", status: "failed",
                error: `El valor en la posición ${validate_check_index + 1} (${dft_data[validate_check_index]}) contiene cáracteres no válidos`
            });
            return;
        }
    } catch (e) {
        postMessage({
            type: "progress", msg: "Validar señal de entrada", status: "failed",
            error: `El valor en la posición ${validate_check_index + 1} (${dft_data[validate_check_index]}) es inválido`
        });
        return;
    }

    if (use_user_defined_size) {
        while (xn.length < user_defined_size)
            xn.push("0");
    }

    if (xn.length > 200) {
        postMessage({ type: "error", msg: "No se puede calcular una DFT con más de 200 elementos" });
        return;
    }

    postMessage({ type: "progress", msg: "Validar señal de entrada", status: "succeeded" });


    postMessage({ type: "progress", msg: "Construir matriz de Fourier", status: "working" });
    // Fourier matrix
    const [wn, wn_tex] = build_wn(xn.length);
    postMessage({ type: "progress", msg: "Construir matriz de Fourier", status: "succeeded" });
    if (xn.length < 51)
        postMessage({ type: "internal", msg: "wn_data", value: wn_tex });
    else
        postMessage({ type: "progress", msg: "Mostrar matriz", status: "failed" });



    postMessage({ type: "progress", msg: "Multiplicar matrices", status: "working" });
    // xkn is X(k) not simplified
    const [xkn, xkn_base_tex, xkn_tex] = multiply_wn_xn(xn, wn);
    postMessage({ type: "progress", msg: "Multiplicar matrices", status: "succeeded" });
    if (xn.length < 31)
        postMessage({ type: "internal", msg: "xkn_data", value: [wn_tex, xn, xkn_base_tex, xkn_tex] });
    else
        postMessage({ type: "progress", msg: "Mostrar X(k) sin sustituciones", status: "failed" });


    postMessage({ type: "progress", msg: "Calcular valores W", status: "working" });
    // ws is the W values
    const [ws, euler, cis, ev] = calculate_ws(xn.length);
    postMessage({ type: "progress", msg: "Calcular valores W", status: "succeeded" });
    postMessage({ type: "internal", msg: "ws_data", value: [euler, cis, ev] });


    postMessage({ type: "progress", msg: "Calcular resultado", status: "working" });
    let xk = null;
    try {
        xk = evaluate_xkn(ws, xkn);
        postMessage({ type: "progress", msg: "Calcular resultado", status: "succeeded" });
    } catch (e) {
        postMessage({ type: "progress", msg: "Calcular resultado", status: "failed" });
        return;
    }

    postMessage({ type: "internal", msg: "xk_data", value: xk });

    // show_result();
    // xn.forEach(e => console.log(e));
}

self.addEventListener("message", e => {
    if (e.data.operation === "start")
        perform_operation(e.data);
});
