// aptos-contracts/sources/encrypted_ballot.move
module voting::encrypted_ballot {
    use std::signer;
    use std::vector;
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use aptos_std::table::{Self, Table};
    use voting::voter_registry;

    /// Error codes
    const EPOLLING_NOT_STARTED: u64 = 1;
    const EPOLLING_ENDED: u64 = 2;
    const ENOT_ELIGIBLE: u64 = 3;
    const EINVALID_COMMITMENT: u64 = 4;
    const EUNAUTHORIZED: u64 = 5;

    /// Vote commitment structure
    #[event]
    struct VoteCommitment has store, drop {
        voter_commitment: vector<u8>,    // Anonymous voter commitment
        vote_hash: vector<u8>,           // Encrypted vote hash
        ipfs_hash: vector<u8>,           // IPFS hash of encrypted vote
        tracking_code_hash: vector<u8>,  // Anonymous tracking code
        cast_at: u64,                    // Timestamp
        is_final: bool,                  // Is this the final vote?
    }

    /// Ballot box storage
    #[event]
    struct BallotBox has key {
        votes: Table<vector<u8>, VoteCommitment>,  // tracking_code_hash -> VoteCommitment
        vote_count: u64,
        polling_start: u64,
        polling_end: u64,
        admin: address,
        merkle_root: vector<u8>,         // Merkle root of all votes
    }

    /// Vote casting events
    #[event]
    struct VoteCastEvent has drop, store {
        tracking_code_hash: vector<u8>,
        cast_at: u64,
    }

    #[event]
    struct VoteReplacedEvent has drop, store {
        tracking_code_hash: vector<u8>,
        replaced_at: u64,
    }

    /// Initialize ballot box
    public entry fun initialize(
        admin: &signer,
        polling_start: u64,
        polling_end: u64
    ) {
        let admin_addr = signer::address_of(admin);
        
        move_to(admin, BallotBox {
            votes: table::new(),
            vote_count: 0,
            polling_start,
            polling_end,
            admin: admin_addr,
            merkle_root: vector::empty(),
        });
    }

    /// Cast an encrypted vote
    public entry fun cast_vote(
        voter: &signer,
        epic_hash: vector<u8>,
        voter_commitment: vector<u8>,
        vote_hash: vector<u8>,
        ipfs_hash: vector<u8>,
        tracking_code_hash: vector<u8>,
    ) acquires BallotBox {
        let ballot_box = borrow_global_mut<BallotBox>(@voting);
        let now = timestamp::now_seconds();
        
        // Check polling period
        assert!(now >= ballot_box.polling_start, EPOLLING_NOT_STARTED);
        assert!(now <= ballot_box.polling_end, EPOLLING_ENDED);
        
        // Check voter eligibility
        assert!(voter_registry::is_voter_eligible(epic_hash), ENOT_ELIGIBLE);
        
        // Check if this is a re-vote (last vote counts rule)
        let is_revote = table::contains(&ballot_box.votes, tracking_code_hash);
        
        if (is_revote) {
            // Mark previous vote as not final
            let old_vote = table::borrow_mut(&mut ballot_box.votes, tracking_code_hash);
            old_vote.is_final = false;
            
            event::emit(VoteReplacedEvent {
                tracking_code_hash: copy tracking_code_hash,
                replaced_at: now,
            });
        };
        
        // Create new vote commitment
        let commitment = VoteCommitment {
            voter_commitment,
            vote_hash,
            ipfs_hash,
            tracking_code_hash: copy tracking_code_hash,
            cast_at: now,
            is_final: true,
        };
        
        // Store vote
        if (is_revote) {
            table::upsert(&mut ballot_box.votes, tracking_code_hash, commitment);
        } else {
            table::add(&mut ballot_box.votes, tracking_code_hash, commitment);
            ballot_box.vote_count = ballot_box.vote_count + 1;
        };
        
        // Mark voter as voted (can be reset for revote)
        voter_registry::mark_voted(epic_hash);
        
        // Emit event
        event::emit(VoteCastEvent {
            tracking_code_hash: copy tracking_code_hash,
            cast_at: now,
        });
    }

    /// Verify vote by tracking code
    #[view]
    public fun verify_vote(tracking_code_hash: vector<u8>): (bool, vector<u8>, u64) acquires BallotBox {
        let ballot_box = borrow_global<BallotBox>(@voting);
        
        if (!table::contains(&ballot_box.votes, tracking_code_hash)) {
            return (false, vector::empty(), 0)
        };
        
        let vote = table::borrow(&ballot_box.votes, tracking_code_hash);
        let hash = vote.vote_hash; // extract field
        (vote.is_final, copy hash, vote.cast_at)
    }

    /// Check if polling is active
    #[view]
    public fun is_polling_active(): bool acquires BallotBox {
        let ballot_box = borrow_global<BallotBox>(@voting);
        let now = timestamp::now_seconds();
        now >= ballot_box.polling_start && now <= ballot_box.polling_end
    }

    /// Get vote count
    #[view]
    public fun get_vote_count(): u64 acquires BallotBox {
        let ballot_box = borrow_global<BallotBox>(@voting);
        ballot_box.vote_count
    }

    /// Admin: Update merkle root after tally
    public entry fun update_merkle_root(admin: &signer, merkle_root: vector<u8>) acquires BallotBox {
        let ballot_box = borrow_global_mut<BallotBox>(@voting);
        let admin_addr = signer::address_of(admin);
        
        assert!(admin_addr == ballot_box.admin, EUNAUTHORIZED);
        
        ballot_box.merkle_root = merkle_root;
    }

    /// Get merkle root
    #[view]
    public fun get_merkle_root(): vector<u8> acquires BallotBox {
        let ballot_box = borrow_global<BallotBox>(@voting);
        let root = ballot_box.merkle_root;
        copy root
    }


    #[test_only]
    public fun initialize_for_test(admin: &signer) {
        let now = timestamp::now_seconds();
        initialize(admin, now, now + 86400); // 24 hour polling
    }
}