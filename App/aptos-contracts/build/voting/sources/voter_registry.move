// aptos-contracts/sources/voter_registry.move
module voting::voter_registry {
    use std::signer;
    // Removed unused std::vector
    use aptos_framework::event;
    use aptos_framework::timestamp;
    use aptos_std::table::{Self, Table};

    /// Error codes
    const EALREADY_REGISTERED: u64 = 1;
    const ENOT_REGISTERED: u64 = 2;
    const EINVALID_EPIC_HASH: u64 = 3;
    const EUNAUTHORIZED: u64 = 4;

    /// Voter registration record
    #[event]
    struct VoterRegistration has store, drop {
        epic_hash: vector<u8>,          // Hashed EPIC number
        aadhaar_hash: vector<u8>,       // Hashed Aadhaar
        biometric_hash: vector<u8>,     // Biometric baseline hash
        registered_at: u64,             // Registration timestamp
        is_active: bool,                // Active status
        is_struck_off: bool,            // Struck off from physical roll
        has_voted: bool,                // Voting status
    }

    /// Global registry storage
    #[event]
    struct Registry has key {
        voters: Table<vector<u8>, VoterRegistration>,  // epic_hash -> VoterRegistration
        total_registered: u64,
        admin: address,
    }

    /// Registration events
    #[event]
    struct RegistrationEvent has drop, store {
        epic_hash: vector<u8>,
        registered_at: u64,
    }
    #[event]
    struct VotingEvent has drop, store {
        epic_hash: vector<u8>,
        voted_at: u64,
    }

    /// Initialize the registry (called once by deployer)
    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        move_to(admin, Registry {
            voters: table::new(),
            total_registered: 0,
            admin: admin_addr,
        });
    }

    /// Register a new voter
    public entry fun register_voter(
        voter: &signer,
        epic_hash: vector<u8>,
        aadhaar_hash: vector<u8>,
        biometric_hash: vector<u8>,
    ) acquires Registry {
        let registry = borrow_global_mut<Registry>(@voting);
        
        // Check if already registered
        assert!(!table::contains(&registry.voters, epic_hash), EALREADY_REGISTERED);
        
        // Create registration record
        let registration = VoterRegistration {
            epic_hash: copy epic_hash,
            aadhaar_hash,
            biometric_hash,
            registered_at: timestamp::now_seconds(),
            is_active: true,
            is_struck_off: true,  // Strike off from physical roll
            has_voted: false,
        };
        
        // Store registration
        table::add(&mut registry.voters, epic_hash, registration);
        registry.total_registered = registry.total_registered + 1;
        
        // Emit event
        event::emit(RegistrationEvent {
            epic_hash: copy epic_hash,
            registered_at: timestamp::now_seconds(),
        });
    }

    /// Check if voter is eligible (registered and active)
    public fun is_voter_eligible(epic_hash: vector<u8>): bool acquires Registry {
        let registry = borrow_global<Registry>(@voting);
        
        if (!table::contains(&registry.voters, epic_hash)) {
            return false
        };
        
        let voter = table::borrow(&registry.voters, epic_hash);
        voter.is_active && !voter.has_voted
    }

    /// Mark voter as having voted
    public entry fun mark_voted(epic_hash: vector<u8>) acquires Registry {
        let registry = borrow_global_mut<Registry>(@voting);
        
        assert!(table::contains(&registry.voters, epic_hash), ENOT_REGISTERED);
        
        let voter = table::borrow_mut(&mut registry.voters, epic_hash);
        voter.has_voted = true;
        
        // Emit event
        event::emit(VotingEvent {
            epic_hash: copy epic_hash,
            voted_at: timestamp::now_seconds(),
        });
    }

    /// Reset voting status (for "last vote counts" rule)
    public entry fun reset_voted_status(epic_hash: vector<u8>) acquires Registry {
        let registry = borrow_global_mut<Registry>(@voting);
        
        assert!(table::contains(&registry.voters, epic_hash), ENOT_REGISTERED);
        
        let voter = table::borrow_mut(&mut registry.voters, epic_hash);
        voter.has_voted = false;
    }

    #[view]
    /// Get voter details (view function)
    public fun get_voter_details(epic_hash: vector<u8>): (bool, u64, bool, bool) acquires Registry {
        let registry = borrow_global<Registry>(@voting);
        
        if (!table::contains(&registry.voters, epic_hash)) {
            return (false, 0, false, false)
        };
        
        let voter = table::borrow(&registry.voters, epic_hash);
        (voter.is_active, voter.registered_at, voter.is_struck_off, voter.has_voted)
    }

    #[view]
    /// Get total registered voters
    public fun get_total_registered(): u64 acquires Registry {
        let registry = borrow_global<Registry>(@voting);
        registry.total_registered
    }

    /// Admin: Deactivate a voter
    public entry fun deactivate_voter(admin: &signer, epic_hash: vector<u8>) acquires Registry {
        let registry = borrow_global_mut<Registry>(@voting);
        let admin_addr = signer::address_of(admin);
        
        assert!(admin_addr == registry.admin, EUNAUTHORIZED);
        assert!(table::contains(&registry.voters, epic_hash), ENOT_REGISTERED);
        
        let voter = table::borrow_mut(&mut registry.voters, epic_hash);
        voter.is_active = false;
    }

    #[test_only]
    public fun initialize_for_test(admin: &signer) {
        initialize(admin);
    }
}
