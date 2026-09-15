package handlers

import (
	"context"
	"net/http"

	"github.com/danielgtaylor/huma/v2"
	"github.com/openpost/backend/internal/services/githubstars"
)

type GitHubStarsHandler struct {
	service *githubstars.Service
}

type GitHubStarsResponse struct {
	Count *int `json:"count,omitempty" doc:"Current public repository star count"`
}

type GitHubStarsOutput struct {
	Body GitHubStarsResponse
}

func NewGitHubStarsHandler(service *githubstars.Service) *GitHubStarsHandler {
	return &GitHubStarsHandler{service: service}
}

func (h *GitHubStarsHandler) RegisterRoutes(api huma.API) {
	huma.Register(api, huma.Operation{
		OperationID: "get-github-star-count",
		Method:      http.MethodGet,
		Path:        "/github-stars",
		Summary:     "Get the OpenPost GitHub star count",
		Description: "Returns a cached public count for the OpenPost GitHub repository when GitHub is available.",
		Tags:        []string{"System"},
	}, h.getCount)
}

func (h *GitHubStarsHandler) getCount(ctx context.Context, _ *struct{}) (*GitHubStarsOutput, error) {
	response := &GitHubStarsOutput{}
	if h.service == nil {
		return response, nil
	}
	if count, ok := h.service.Count(ctx); ok {
		response.Body.Count = &count
	}
	return response, nil
}
