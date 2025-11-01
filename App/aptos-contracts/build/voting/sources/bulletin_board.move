// aptos-contracts/sources/bulletin_board.move
module voting::bulletin_board {
    use std::signer;
    use std::vector;
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use aptos_std::table::{Self, Table};

    /// Error codes
    const EALREADY_RECORDED: u64 = 1;
    const ENOT_FOUND: u64 = 2;

    /// Public vote record for verification
    #[event]
    struct VoteRecord has store, drop {
        commitment: vector<u8>,         // Vote commitment hash
        timestamp: u64,                 // When recorded
        is_valid: bool,                 // Validity status
        merkle_proof: vector<vector<u8>>, // Merkle proof
    }

    /// Bulletin board storage
    #[event]
    struct BulletinBoard has key {
        records: Table<vector<u8>, VoteRecord>,  // tracking_code_hash -> VoteRecord
        total_records: u64,
        merkle_root: vector<u8>,
        election_id: vector<u8>,
    }

    /// Record published event
    #[event]
    struct RecordPublishedEvent has drop, store {
        tracking_code_hash: vector<u8>,
        commitment: vector<u8>,
        timestamp: u64,
    }

    /// Initialize bulletin board
    public entry fun initialize(admin: &signer, election_id: vector<u8>) {
        move_to(admin, BulletinBoard {
            records: table::new(),
            total_records: 0,
            merkle_root: vector::empty(),
            election_id,
        });
    }

    /// Record a vote on the bulletin board
    public entry fun record_vote(
        _publisher: &signer,  // Can be called by voting module
        tracking_code_hash: vector<u8>,
        commitment: vector<u8>,
    ) acquires BulletinBoard {
        let board = borrow_global_mut<BulletinBoard>(@voting);
        
        // Check if already recorded (allow updates for revotes)
        let is_update = table::contains(&board.records, tracking_code_hash);
        
        let record = VoteRecord {
            commitment: copy commitment,
            timestamp: timestamp::now_seconds(),
            is_valid: true,
            merkle_proof: vector::empty(),
        };
        
        if (is_update) {
            table::upsert(&mut board.records, tracking_code_hash, record);
        } else {
            table::add(&mut board.records, tracking_code_hash, record);
            board.total_records = board.total_records + 1;
        };
        
        // Emit event
        event::emit(RecordPublishedEvent {
            tracking_code_hash: copy tracking_code_hash,
            commitment: copy commitment,
            timestamp: timestamp::now_seconds(),
        });
    }

    #[view]
    /// Get vote record for verification
    public fun get_vote_record(
        tracking_code_hash: vector<u8>
    ): (vector<u8>, u64, bool) acquires BulletinBoard {
        let board = borrow_global<BulletinBoard>(@voting);
        
        if (!table::contains(&board.records, tracking_code_hash)) {
            return (vector::empty(), 0, false)
        };
        
        let record = table::borrow(&board.records, tracking_code_hash);
        let commitment = record.commitment;
        (copy commitment, record.timestamp, record.is_valid)
    }

    /// Update merkle proof for a vote
    public entry fun update_merkle_proof(
        admin: &signer,
        tracking_code_hash: vector<u8>,
        merkle_proof: vector<vector<u8>>,
    ) acquires BulletinBoard {
        let board = borrow_global_mut<BulletinBoard>(@voting);
        let _ = signer::address_of(admin); // Verify admin (add check in production)
        
        assert!(table::contains(&board.records, tracking_code_hash), ENOT_FOUND);
        
        let record = table::borrow_mut(&mut board.records, tracking_code_hash);
        record.merkle_proof = merkle_proof;
    }

    /// Update global merkle root
    public entry fun update_merkle_root(
        admin: &signer,
        merkle_root: vector<u8>,
    ) acquires BulletinBoard {
        let board = borrow_global_mut<BulletinBoard>(@voting);
        let _ = signer::address_of(admin);
        
        board.merkle_root = merkle_root;
    }

    #[view]
    /// Get statistics
    public fun get_statistics(): (u64, vector<u8>, vector<u8>) acquires BulletinBoard {
        let board = borrow_global<BulletinBoard>(@voting);
        let mkl = board.merkle_root;
        let election_id = board.election_id;
        (board.total_records, copy mkl, copy election_id)
    }

    #[view]
    /// Verify merkle proof (simplified - expand in production)
    public fun verify_merkle_proof(
        tracking_code_hash: vector<u8>,
        merkle_root: vector<u8>,
    ): bool acquires BulletinBoard {
        let board = borrow_global<BulletinBoard>(@voting);
        
        if (!table::contains(&board.records, tracking_code_hash)) {
            return false
        };
        
        // In production: implement full merkle proof verification
        // For now: simple root comparison
        merkle_root == board.merkle_root
    }

    #[test_only]
    public fun initialize_for_test(admin: &signer) {
        initialize(admin, b"TEST_ELECTION_2025");
    }
}
