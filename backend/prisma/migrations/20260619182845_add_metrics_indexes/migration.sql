-- CreateIndex
CREATE INDEX "review_comments_reviewId_accepted_idx" ON "review_comments"("reviewId", "accepted");

-- CreateIndex
CREATE INDEX "reviews_userId_createdAt_idx" ON "reviews"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "reviews_createdAt_idx" ON "reviews"("createdAt");
