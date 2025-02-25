import sys
import json

def solve_multi_choice_knapsack(C, P, B):
    n_choices = len(C)  
    
    min_cost = sum(choice[0] for choice in C)    
    max_cost = sum(choice[-1] for choice in C)
    
    if B < min_cost:
        return {"error": "Budget less than minimum"}
    
    if B >= max_cost:
        # choose the highest preference choices
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
    
    return {
        "preferences": final_pref,
        "choices": final_choices,
        "cost": actual_cost
    }

input_data = json.loads(sys.argv[1])

Q = input_data["quantities"]
P = input_data["preferences"]
B = input_data["budget"]

R = [
    [10, 15, 20, 25, 30],    
    [50, 60, 70, 80, 90],    
    [100, 120, 140, 160, 180],  
    [200, 250, 300, 350, 400]  
]

C = [[r * Q[i] for r in R[i]] for i in range(len(R))]

# Solve and output result
result = solve_multi_choice_knapsack(C, P, B)
print(json.dumps(result)) 