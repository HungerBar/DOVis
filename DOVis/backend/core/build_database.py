from backend.core.database import DB_PATH, SOURCE_NC_PATH, import_netcdf_to_sqlite


def main():
    print(f"[Database] source: {SOURCE_NC_PATH}")
    print(f"[Database] output: {DB_PATH}")
    import_netcdf_to_sqlite(SOURCE_NC_PATH, DB_PATH)
    print("[Database] import complete")


if __name__ == "__main__":
    main()
