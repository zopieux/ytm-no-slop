#!/usr/bin/env bash
set -e

SIZES=(16 32 48 96 128)
INPUTS=("icon" "icon-gray" "icon-empty")

for input_name in "${INPUTS[@]}"; do
    INPUT="public/${input_name}.svg"
for size in "${SIZES[@]}"; do
    OUTPUT="public/${input_name}-${size}.png"
    echo "Generating $OUTPUT ($size x $size)..."
    inkscape -w "$size" -h "$size" -o "$OUTPUT" "$INPUT"
done
done

echo "Done!"
