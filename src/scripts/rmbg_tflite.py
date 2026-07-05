#!/usr/bin/env python3
import argparse
import json
import sys


def load_interpreter_class():
    try:
        from tflite_runtime.interpreter import Interpreter

        return Interpreter
    except Exception:
        pass

    try:
        from ai_edge_litert.interpreter import Interpreter

        return Interpreter
    except Exception:
        pass

    try:
        from tensorflow.lite import Interpreter

        return Interpreter
    except Exception as error:
        raise RuntimeError(
            "Nenhum runtime TFLite disponível. Instale tflite-runtime, ai-edge-litert ou tensorflow."
        ) from error


def check_runtime():
    import numpy
    from PIL import Image

    interpreter_class = load_interpreter_class()

    print(
        json.dumps(
            {
                "ok": True,
                "numpy": numpy.__version__,
                "pillow": Image.__version__,
                "interpreter": f"{interpreter_class.__module__}.{interpreter_class.__name__}",
            }
        )
    )


def get_input_size(input_details):
    shape = input_details[0].get("shape")

    if shape is None or len(shape) != 4:
        return 320, 320, "nhwc"

    shape = [int(value) for value in shape]

    if shape[1] in (1, 3, 4):
        return shape[2], shape[3], "nchw"

    return shape[1], shape[2], "nhwc"


def prepare_input(image, input_details):
    import numpy as np
    from PIL import Image

    height, width, layout = get_input_size(input_details)
    resized = image.convert("RGB").resize((width, height), Image.Resampling.LANCZOS)
    array = np.asarray(resized).astype(np.float32) / 255.0

    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
    array = (array - mean) / std

    if layout == "nchw":
        array = np.transpose(array, (2, 0, 1))

    array = np.expand_dims(array, axis=0)
    dtype = input_details[0].get("dtype")

    if dtype is not None and dtype != np.float32:
        scale, zero_point = input_details[0].get("quantization", (0, 0))

        if scale:
            array = array / scale + zero_point

        array = array.astype(dtype)

    return array


def normalize_mask(output, output_details):
    import numpy as np

    scale, zero_point = output_details.get("quantization", (0, 0))

    if scale:
        output = (output.astype(np.float32) - zero_point) * scale

    mask = np.squeeze(output).astype(np.float32)

    while mask.ndim > 2:
        mask = mask[0]

    min_value = float(mask.min())
    max_value = float(mask.max())

    if max_value - min_value > 1e-8:
        mask = (mask - min_value) / (max_value - min_value)

    return np.clip(mask, 0.0, 1.0)


def remove_background(model_path, input_path, output_path):
    import numpy as np
    from PIL import Image

    Interpreter = load_interpreter_class()
    interpreter = Interpreter(model_path=model_path)
    interpreter.allocate_tensors()

    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    original = Image.open(input_path).convert("RGBA")
    model_input = prepare_input(original, input_details)

    interpreter.set_tensor(input_details[0]["index"], model_input)
    interpreter.invoke()

    output = interpreter.get_tensor(output_details[0]["index"])
    mask = normalize_mask(output, output_details[0])
    alpha = Image.fromarray((mask * 255).astype(np.uint8), mode="L")
    alpha = alpha.resize(original.size, Image.Resampling.LANCZOS)

    result = original.copy()
    result.putalpha(alpha)
    result.save(output_path, "PNG")


def main():
    parser = argparse.ArgumentParser(description="Remove fundo usando modelo RMBG TFLite.")
    parser.add_argument("--check-runtime", action="store_true")
    parser.add_argument("--model")
    parser.add_argument("--input")
    parser.add_argument("--output")
    args = parser.parse_args()

    if args.check_runtime:
        check_runtime()
        return

    if not args.model or not args.input or not args.output:
        raise SystemExit("--model, --input e --output são obrigatórios.")

    remove_background(args.model, args.input, args.output)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"RMBG_ERROR: {error}", file=sys.stderr)
        raise
