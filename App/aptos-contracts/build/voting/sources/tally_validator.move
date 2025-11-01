// aptos-contracts/sources/tally_validator.move
module voting::tally_validator {
    use std::signer;
    use std::vector;
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use aptos_std::table::{Self, Table};

    /// Error codes
    const EPOLLING_NOT_ENDED: u64 = 1;
    const EALREADY_FINALIZED: u64 = 2;
    const EUNAUTHORIZED: u64 = 3;
    const EINVALID_PROOF: u64 = 4;
    const ENOT_FINALIZED: u64 = 5;

    /// Candidate result structure
    #[event]
    struct CandidateResult has store, drop, copy {
        candidate_id: vector<u8>,
        vote_count: u64,
        percentage: u64,  // Percentage * 100 (e.g., 4523 = 45.23%)
    }

    /// Tally record
    #[event]
    struct TallyRecord has key {
        election_id: vector<u8>,
        results: Table<vector<u8>, CandidateResult>,  // candidate_id -> CandidateResult
        total_votes: u64,
        valid_votes: u64,
        invalid_votes: u64,
        polling_end_time: u64,
        tally_start_time: u64,
        tally_end_time: u64,
        is_finalized: bool,
        admin: address,
        result_hash: vector<u8>,       // Hash of final results
        zkp_proof: vector<u8>,          // Zero-knowledge proof of tally
    }

    /// Tally events
    #[event]
    struct TallyStartedEvent has drop, store {
        election_id: vector<u8>,
        started_at: u64,
        total_votes: u64,
    }
    #[event]
    struct TallyFinalizedEvent has drop, store {
        election_id: vector<u8>,
        finalized_at: u64,
        total_votes: u64,
        valid_votes: u64,
    }
    #[event]
    struct ResultPublishedEvent has drop, store {
        candidate_id: vector<u8>,
        vote_count: u64,
        percentage: u64,
    }

    /// Initialize tally validator
    public entry fun initialize(
        admin: &signer,
        election_id: vector<u8>,
        polling_end_time: u64
    ) {
        let admin_addr = signer::address_of(admin);
        
        move_to(admin, TallyRecord {
            election_id,
            results: table::new(),
            total_votes: 0,
            valid_votes: 0,
            invalid_votes: 0,
            polling_end_time,
            tally_start_time: 0,
            tally_end_time: 0,
            is_finalized: false,
            admin: admin_addr,
            result_hash: vector::empty(),
            zkp_proof: vector::empty(),
        });
    }

    /// Start tally process (can only be called after polling ends)
    public entry fun start_tally(
        admin: &signer,
        total_votes: u64
    ) acquires TallyRecord {
        let tally = borrow_global_mut<TallyRecord>(@voting);
        let admin_addr = signer::address_of(admin);
        let now = timestamp::now_seconds();
        
        // Verify authorization
        assert!(admin_addr == tally.admin, EUNAUTHORIZED);
        
        // Verify polling has ended
        assert!(now >= tally.polling_end_time, EPOLLING_NOT_ENDED);
        
        // Verify not already finalized
        assert!(!tally.is_finalized, EALREADY_FINALIZED);
        
        tally.total_votes = total_votes;
        tally.tally_start_time = now;
        
        // Move the election_id into a local so we can include it in the event
        let election_id = tally.election_id;
        
        // Emit event
        event::emit(TallyStartedEvent {
            election_id,
            started_at: now,
            total_votes,
        });
    }

    /// Record candidate result
    public entry fun record_result(
        admin: &signer,
        candidate_id: vector<u8>,
        vote_count: u64,
        percentage: u64
    ) acquires TallyRecord {
        let tally = borrow_global_mut<TallyRecord>(@voting);
        let admin_addr = signer::address_of(admin);
        
        // Verify authorization
        assert!(admin_addr == tally.admin, EUNAUTHORIZED);
        
        // Verify not finalized yet
        assert!(!tally.is_finalized, EALREADY_FINALIZED);
        
        let result = CandidateResult {
            candidate_id: copy candidate_id,
            vote_count,
            percentage,
        };
        
        // Update or add result
        if (table::contains(&tally.results, candidate_id)) {
            table::upsert(&mut tally.results, candidate_id, result);
        } else {
            table::add(&mut tally.results, candidate_id, result);
        };
        
        // Emit event
        event::emit(ResultPublishedEvent {
            candidate_id: copy candidate_id,
            vote_count,
            percentage,
        });
    }

    /// Finalize tally with ZKP proof
    public entry fun finalize_tally(
        admin: &signer,
        valid_votes: u64,
        invalid_votes: u64,
        result_hash: vector<u8>,
        zkp_proof: vector<u8>
    ) acquires TallyRecord {
        let tally = borrow_global_mut<TallyRecord>(@voting);
        let admin_addr = signer::address_of(admin);
        let now = timestamp::now_seconds();
        
        // Verify authorization
        assert!(admin_addr == tally.admin, EUNAUTHORIZED);
        
        // Verify not already finalized
        assert!(!tally.is_finalized, EALREADY_FINALIZED);
        
        // Update tally record
        tally.valid_votes = valid_votes;
        tally.invalid_votes = invalid_votes;
        tally.result_hash = result_hash;
        tally.zkp_proof = zkp_proof;
        tally.tally_end_time = now;
        tally.is_finalized = true;
        
        // Move election_id into local for the event
        let election_id = tally.election_id;

        // Emit event
        event::emit(TallyFinalizedEvent {
            election_id,
            finalized_at: now,
            total_votes: tally.total_votes,
            valid_votes,
        });
    }

    /// Get candidate result
    #[view]
    public fun get_candidate_result(candidate_id: vector<u8>): (bool, u64, u64) acquires TallyRecord {
        let tally = borrow_global<TallyRecord>(@voting);
        
        if (!table::contains(&tally.results, candidate_id)) {
            return (false, 0, 0)
        };
        
        let result = table::borrow(&tally.results, candidate_id);
        (true, result.vote_count, result.percentage)
    }

    /// Get tally summary
    #[view]
    public fun get_tally_summary(): (u64, u64, u64, bool, u64) acquires TallyRecord {
        let tally = borrow_global<TallyRecord>(@voting);
        (
            tally.total_votes,
            tally.valid_votes,
            tally.invalid_votes,
            tally.is_finalized,
            tally.tally_end_time
        )
    }

    /// Verify tally proof
    #[view]
    public fun verify_tally_proof(result_hash: vector<u8>): bool acquires TallyRecord {
        let tally = borrow_global<TallyRecord>(@voting);
        
        // Verify tally is finalized
        if (!tally.is_finalized) {
            return false
        };
        
        // Simple hash comparison (in production: verify full ZKP)
        result_hash == tally.result_hash
    }

    /// Get ZKP proof
    #[view]
    public fun get_zkp_proof(): vector<u8> acquires TallyRecord {
        let tally = borrow_global<TallyRecord>(@voting);
        assert!(tally.is_finalized, ENOT_FINALIZED);
        let proof = tally.zkp_proof;
        proof
    }

    /// Check if tally is finalized
    #[view]
    public fun is_finalized(): bool acquires TallyRecord {
        let tally = borrow_global<TallyRecord>(@voting);
        tally.is_finalized
    }

    #[test_only]
    public fun initialize_for_test(admin: &signer) {
        let now = timestamp::now_seconds();
        initialize(admin, b"TEST_ELECTION_2025", now);
    }
}
