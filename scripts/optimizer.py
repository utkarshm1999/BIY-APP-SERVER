import sys
import json
import logging

# Set up logging for debug messages
logging.basicConfig(
    level=logging.DEBUG,
    format='DEBUG: %(message)s',
    stream=sys.stderr
)

def solve_multi_choice_knapsack(C, P, B):
    n_choices = len(C)  
    
    min_cost = sum(choice[0] for choice in C)    
    max_cost = sum(choice[-1] for choice in C)
    
    if B < min_cost:
        return {"error": "Budget less than minimum"}
    
    if B >= max_cost:
        # choose the highest preference choices
        logging.debug(f'max_cost: {max_cost}')
        logging.debug(f'min_cost: {min_cost}')
        return {"error": "Budget out of feasible range"}
    
    bucket_size = B / 1000
    buckets = 1001  
    
    # dp[i][b] : [
    #          bucket1                      bucket2                   ...
    #  [(max_preference, choices), (max_preference, choices), ...] --> picking only first choice
    #  [(max_preference, choices), (max_preference, choices), ...] --> picking first and second choice
    #   ...
    # ]

    dp = [[(0, []) for _ in range(buckets)] for _ in range(n_choices)]
    
    # Initialize first choice (i=0) for all buckets
    for b in range(buckets):
        target_cost = b * bucket_size
        best_pref = float('-inf')
        best_item = 0
        
        
        for item, (cost, pref) in enumerate(zip(C[0], P[0])):
            if cost <= target_cost:
                if pref > best_pref:
                    best_pref = pref
                    best_item = item
        
        if best_pref != float('-inf'):
            dp[0][b] = (best_pref, [best_item])
    
    # Fill DP table for remaining choices
    for i in range(1, n_choices):
        for b in range(buckets):
            target_cost = b * bucket_size
            best_pref = float('-inf')
            best_combo = []
            
            for item, (cost, pref) in enumerate(zip(C[i], P[i])):
                remaining_cost = target_cost - cost
                if remaining_cost < 0:
                    continue
                    
                
                prev_bucket = int(remaining_cost / bucket_size)  
                if prev_bucket >= 0 and prev_bucket < buckets:
                    prev_pref, prev_choices = dp[i-1][prev_bucket]
                    total_pref = prev_pref + pref
                    
                    if total_pref > best_pref:
                        best_pref = total_pref
                        best_combo = prev_choices + [item]
            
            dp[i][b] = (best_pref, best_combo)
    
    final_pref, final_choices = dp[n_choices - 1][buckets - 1]
    actual_cost = sum(C[i][choice] for i, choice in enumerate(final_choices))
    
    logging.debug(f'Final preferences: {final_pref}')
    logging.debug(f'Actual cost: {actual_cost}')
    
    return {
        "choices": final_choices,
    }

input_data = json.loads(sys.argv[1])

Q = input_data["quantities"]
R = input_data["rates"]
P = input_data["preferenceLevels"]
budget = input_data["budget"]

# Calculate costs based on quantities and rates
C = [[r * Q[i] for r in R[i]] for i in range(len(R))]

# Solve and output result
result = solve_multi_choice_knapsack(C, P, budget)
print(json.dumps(result)) 