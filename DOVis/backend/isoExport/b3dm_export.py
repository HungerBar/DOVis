import struct


def pad8(data: bytes) -> bytes:
    """
    8-byte alignment padding
    """
    padding = (8 - (len(data) % 8)) % 8
    return data + b"\x00" * padding


def pad_json(data: bytes) -> bytes:
    """
    JSON padding must use spaces (0x20)
    """
    padding = (8 - (len(data) % 8)) % 8
    return data + b"\x20" * padding


def glb_to_b3dm(glb_bytes: bytes, batch_length: int = 1) -> bytes:
    """
    Cesium-compatible b3dm exporter
    """
    if isinstance(glb_bytes, memoryview):
        glb_bytes = glb_bytes.tobytes()
    if not isinstance(glb_bytes, (bytes, bytearray)):
        raise TypeError("glb_bytes must be bytes")

    # =====================================================
    # b3dm header
    # =====================================================
    magic = b"b3dm"
    version = 1

    # =====================================================
    # feature table - ✅ 必须包含 BATCH_LENGTH
    # =====================================================
    ft_json = pad_json(f'{{"BATCH_LENGTH":{batch_length}}}'.encode("utf-8"))
    ft_bin = b""

    # =====================================================
    # batch table - 可以为空，但结构要正确
    # =====================================================
    # 如果没有批处理数据，也要保证格式正确
    bt_json = pad_json(b"{}")
    bt_bin = b""

    # =====================================================
    # glb alignment
    # =====================================================
    glb_bytes = pad8(glb_bytes)

    # =====================================================
    # body
    # =====================================================
    body = ft_json + ft_bin + bt_json + bt_bin + glb_bytes
    byte_length = 28 + len(body)

    # =====================================================
    # header
    # =====================================================
    header = struct.pack(
        "<4sIIIIII",
        magic,
        version,
        byte_length,
        len(ft_json),
        len(ft_bin),
        len(bt_json),
        len(bt_bin),
    )

    result = header + body

    # =====================================================
    # validation
    # =====================================================
    if len(result) != byte_length:
        raise RuntimeError(f"Invalid b3dm byte length: {len(result)} != {byte_length}")

    print("====================================")
    print("B3DM export success")
    print("byteLength:", byte_length)
    print("actual:", len(result))
    print("ft_json:", len(ft_json), "->", ft_json[:50])  
    print("bt_json:", len(bt_json))
    print("glb:", len(glb_bytes))
    print("batch_length:", batch_length)
    print("====================================")
    return result
