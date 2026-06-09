import json
import struct


def _pad_bytes(
    data: bytes,
    target_multiple: int = 8,
    pad_byte: bytes = b" ",
    current_offset: int = 0,
) -> bytes:
    """
    Pad bytes so that current_offset + len(data) is aligned to target_multiple.
    """

    remainder = (current_offset + len(data)) % target_multiple

    if remainder == 0:
        return data

    padding = target_multiple - remainder

    return data + pad_byte * padding


def glb_to_b3dm(glb_bytes: bytes) -> bytes:
    """
    Wrap GLB bytes into a minimal B3DM tile.

    B3DM header layout:
        magic                       4 bytes
        version                     uint32
        byteLength                  uint32
        featureTableJSONByteLength  uint32
        featureTableBinaryByteLength uint32
        batchTableJSONByteLength    uint32
        batchTableBinaryByteLength  uint32
    """

    if not isinstance(glb_bytes, (bytes, bytearray)):
        raise TypeError("glb_bytes must be bytes")

    if len(glb_bytes) == 0:
        raise ValueError("Empty GLB bytes")

    if glb_bytes[:4] != b"glTF":
        raise ValueError("Input is not a valid binary GLB")

    header_length = 28

    feature_table_json = json.dumps(
        {
            "BATCH_LENGTH": 0,
        },
        separators=(",", ":"),
    ).encode("utf-8")

    # Make the GLB payload start at an 8-byte-aligned offset.
    feature_table_json = _pad_bytes(
        feature_table_json,
        target_multiple=8,
        pad_byte=b" ",
        current_offset=header_length,
    )

    feature_table_binary = b""
    batch_table_json = b""
    batch_table_binary = b""

    byte_length = (
        header_length
        + len(feature_table_json)
        + len(feature_table_binary)
        + len(batch_table_json)
        + len(batch_table_binary)
        + len(glb_bytes)
    )

    header = struct.pack(
        "<4sIIIIII",
        b"b3dm",
        1,
        byte_length,
        len(feature_table_json),
        len(feature_table_binary),
        len(batch_table_json),
        len(batch_table_binary),
    )

    return (
        header
        + feature_table_json
        + feature_table_binary
        + batch_table_json
        + batch_table_binary
        + glb_bytes
    )
