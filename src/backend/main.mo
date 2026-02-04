import Storage "blob-storage/Storage";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Principal "mo:core/Principal";

import Random "mo:core/Random";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import MixinStorage "blob-storage/Mixin";


actor {
  include MixinStorage();

  // Persistent storage for backend
  let expressionsMap = Map.empty<Text, Expression>();
  let responsesMap = Map.empty<Text, Response>();

  // Types
  type AnonymousUser = Principal;

  type EmpathyType = {
    #listening;
    #reflection;
    #mirroring;
    #silentPresence;
  };

  type ExpressionStatus = {
    #pending;
    #assigned;
    #completed;
    #rejected;
  };

  type ModerationStatus = {
    #unchecked;
    #safe;
    #unsafe;
  };

  type Expression = {
    id : Text;
    audioBlobId : Storage.ExternalBlob;
    creator : AnonymousUser;
    empathyType : EmpathyType;
    status : ExpressionStatus;
    moderationStatus : ModerationStatus;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  type Response = {
    id : Text;
    expressionId : Text;
    audioBlobId : Storage.ExternalBlob;
    responder : AnonymousUser;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  // Generate unique IDs
  func generateId() : async Text {
    let now = Time.now() % 1_000_000_000;
    let randomValue = await* Random.crypto().natRange(0, 1_000_000_000);
    "{now}_{randomValue}";
  };

  // Upload new expression, returns unique id
  public shared ({ caller }) func uploadExpression(audioBlob : Storage.ExternalBlob, empathyType : EmpathyType) : async Text {
    let expression : Expression = {
      id = await generateId();
      audioBlobId = audioBlob;
      creator = caller;
      empathyType;
      status = #pending;
      moderationStatus = #unchecked;
      createdAt = Time.now();
      updatedAt = Time.now();
    };

    expressionsMap.add(expression.id, expression);
    expression.id;
  };

  // Update expression status safely without losing blob reference
  private func updateExpressionStatus(id : Text, status : ExpressionStatus) {
    switch (expressionsMap.get(id)) {
      case (null) { Runtime.trap("Expression does not exist!") };
      case (?existing) {
        let updated = {
          existing with
          status;
          updatedAt = Time.now();
        };
        expressionsMap.add(id, updated);
      };
    };
  };

  // Safely set moderation status without losing other metadata
  private func setModerationStatus(id : Text, status : ModerationStatus) {
    switch (expressionsMap.get(id)) {
      case (null) { Runtime.trap("Expression does not exist!") };
      case (?existing) {
        let updated = {
          existing with
          moderationStatus = status;
          updatedAt = Time.now();
        };
        expressionsMap.add(id, updated);
      };
    };
  };

  // Update expression status to "assigned" during assignment, preserving blobs
  private func completeAssignment(id : Text, cur : Expression) : ?Expression {
    let updated = {
      cur with
      status = #assigned;
      updatedAt = Time.now();
    };
    expressionsMap.add(id, updated);
    ?updated;
  };

  // Combination update for both status and moderation if just reviewed - option both by bool
  private func updateReviewedExpression(id : Text, isSafe : Bool, wasAssigned : Bool) : () {
    switch (expressionsMap.get(id)) {
      case (null) { Runtime.trap("Expression does not exist!") };
      case (?expr) {
        let newStatus = if (wasAssigned) { #assigned } else { #pending };

        let newModeration = if (isSafe) {
          #safe;
        } else { #unsafe };
        let updated = {
          expr with
          status = newStatus;
          moderationStatus = newModeration;
          updatedAt = Time.now();
        };
        expressionsMap.add(id, updated);
      };
    };
  };

  // Random non-caller assignment with fallback to all if empty
  public shared ({ caller }) func assignRandomExpression(_ : Principal) : async ?Expression {
    let allSafeExpressions = expressionsMap.values().toArray().filter(
      func(expr) {
        expr.status == #pending and expr.moderationStatus == #safe
      }
    );

    if (allSafeExpressions.isEmpty()) {
      return null;
    };

    let filtered = allSafeExpressions.filter(
      func(expr) {
        expr.creator.toText() != caller.toText()
      }
    );

    let eligibleExpressions = if (filtered.isEmpty()) {
      allSafeExpressions;
    } else {
      filtered;
    };

    let randomIndex = await* Random.crypto().natRange(0, eligibleExpressions.size());
    let selected = eligibleExpressions[randomIndex];

    switch (expressionsMap.get(selected.id)) {
      case (null) { Runtime.trap("Expression does not exist!") };
      case (?current) { completeAssignment(selected.id, current) };
    };
  };

  // Create response object and finalize expression status
  public shared ({ caller }) func respondToExpression(expressionId : Text, audioBlob : Storage.ExternalBlob) : async Text {
    switch (expressionsMap.get(expressionId)) {
      case (null) { Runtime.trap("Expression does not exist!") };
      case (?_) {
        let response : Response = {
          id = await generateId();
          expressionId;
          audioBlobId = audioBlob;
          responder = caller;
          createdAt = Time.now();
          updatedAt = Time.now();
        };

        responsesMap.add(response.id, response);
        updateExpressionStatus(expressionId, #completed);
        response.id;
      };
    };
  };

  // Get expression
  public query ({ caller }) func getExpression(id : Text) : async ?Expression {
    expressionsMap.get(id);
  };

  // Get response
  public query ({ caller }) func getResponse(id : Text) : async ?Response {
    responsesMap.get(id);
  };

  // General moderation call (safe or unsafe)
  public shared ({ caller }) func moderateExpression(id : Text, isSafe : Bool) : async () {
    setModerationStatus(
      id,
      if (isSafe) { #safe } else { #unsafe }
    );
  };

  // Convenience to moderate and assign
  public shared ({ caller }) func reviewAndAssign(id : Text, isSafe : Bool) : async () {
    updateReviewedExpression(id, isSafe, true);
  };

  // Get all eligible safe & pending expressions
  public query ({ caller }) func getAvailableExpressions() : async [Expression] {
    expressionsMap.values().toArray().filter(
      func(expr) {
        expr.status == #pending and expr.moderationStatus == #safe
      }
    );
  };
};
